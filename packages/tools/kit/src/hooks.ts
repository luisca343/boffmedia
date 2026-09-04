"use client";

/**
 * The one React binding in the kit.
 *
 * The directive is load-bearing rather than decorative: `index.ts` re-exports
 * this module, and apps/web's root layout reaches the barrel through
 * `lib/ui-runtime.ts` — so without it, Next pulls a `useSyncExternalStore` into
 * a Server Component and the build fails outright. Same reason
 * `@boffmedia/ui`'s own hook files carry it.
 *
 * Everything else here is deliberately framework-free, but a tool cannot use
 * `network` without re-rendering when it changes, and leaving every domain
 * package to write the same `useSyncExternalStore` wrapper is how three
 * slightly different ones appear. React is already this package's peer
 * dependency (the registry's `lazy()` components need it), so this costs
 * consumers nothing new.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { getToolHost, hasToolHost } from "./host";
import type { ToolSessionStatus, ToolSessionUser } from "./session";
import {
  createRetryScheduler,
  deriveSyncStatus,
  type RetryScheduler,
  type SyncRetryPolicy,
  type ToolSyncStatus,
} from "./sync-policy";

/**
 * Whether the host can reach the network right now, re-rendering on change.
 *
 * Returns `true` when no host is configured — a tool rendered in a Storybook or
 * a test has no reason to show an outage notice, and defaulting to "offline"
 * there would make every such render display the sad path.
 */
export function useToolOnline(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

function subscribe(onChange: () => void): () => void {
  if (!hasToolHost()) return () => {};
  return getToolHost().network.subscribe(() => onChange());
}

function snapshot(): boolean {
  return hasToolHost() ? getToolHost().network.isOnline() : true;
}

/**
 * Server render (apps/web prerenders every tool route): there is no navigator
 * and no shell, and claiming "offline" would put an outage banner into the
 * static HTML of a page that is fine. The client's first snapshot corrects it.
 */
function serverSnapshot(): boolean {
  return true;
}

/**
 * How many writes this tool still owes the server, re-rendering as that
 * changes.
 *
 * Worth putting on screen. A player who edited their collection on a train has
 * no other way to tell whether it left the device, and "it saved" with a
 * silent queue behind it is the kind of half-truth that loses trust the first
 * time a sync is rejected.
 */
export function useToolPending(namespace: string): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasToolHost()) return () => {};
      return getToolHost().data.outbox(namespace).subscribe(() => onChange());
    },
    [namespace],
  );

  // The count lives in the store rather than in a ref because `subscribe`
  // pushes it: `useSyncExternalStore` needs a snapshot that is stable between
  // notifications, and re-reading IndexedDB per render is neither stable nor
  // synchronous.
  const snapshot = useCallback(() => pendingCounts.get(namespace) ?? 0, [namespace]);
  return useSyncExternalStore(
    (onChange) =>
      subscribe(() => {
        void refreshPending(namespace).then(onChange);
      }),
    snapshot,
    () => 0,
  );
}

/** Last known pending count per namespace, fed by the subscription above. */
const pendingCounts = new Map<string, number>();

async function refreshPending(namespace: string): Promise<void> {
  if (!hasToolHost()) return;
  const entries = await getToolHost().data.outbox(namespace).pending();
  pendingCounts.set(namespace, entries.length);
}

export interface ToolSessionView {
  status: ToolSessionStatus;
  user: ToolSessionUser | null;
  /** True only for `"signed-in"`. `"loading"` is not a no. */
  signedIn: boolean;
  signIn(): void;
}

/**
 * Who is using the tool, re-rendering when that changes.
 *
 * Reports `"loading"` with no host configured rather than `"anonymous"`:
 * outside a host (a test, a styleguide) we do not know, and claiming "signed
 * out" would make every such render show the sign-in branch as if it were a
 * fact.
 */
export function useToolSession(): ToolSessionView {
  const status = useSyncExternalStore(subscribeSession, sessionStatus, loadingStatus);
  const user = useSyncExternalStore(subscribeSession, sessionUser, nullUser);
  return {
    status,
    user,
    signedIn: status === "signed-in",
    signIn: () => {
      if (hasToolHost()) getToolHost().session.signIn();
    },
  };
}

function subscribeSession(onChange: () => void): () => void {
  if (!hasToolHost()) return () => {};
  return getToolHost().session.subscribe(onChange);
}

function sessionStatus(): ToolSessionStatus {
  return hasToolHost() ? getToolHost().session.status() : "loading";
}

function loadingStatus(): ToolSessionStatus {
  return "loading";
}

// Identity-stable: `useSyncExternalStore` compares snapshots with Object.is, so
// returning a fresh `null`-ish object per call would loop forever.
function sessionUser(): ToolSessionUser | null {
  return hasToolHost() ? getToolHost().session.user() : null;
}

function nullUser(): ToolSessionUser | null {
  return null;
}

/* ── sync status ───────────────────────────────────────────────────────────── */

/** What a tool sees before a host exists (SSR, a test, a styleguide): nothing
 *  is owed, because nothing has been written. Identity-stable, because
 *  `useState` initialisers and `Object.is` comparisons both care. */
const IDLE_SYNC: ToolSyncStatus = {
  state: "synced",
  pending: 0,
  attempts: 0,
  lastError: null,
  retryInMs: null,
  rejection: null,
};

export interface ToolSyncView extends ToolSyncStatus {
  /** Try the queue again right now, past the attempt cap. This is the way out
   *  of `stuck`, so any UI that can show that state must offer this. */
  retryNow(): Promise<void>;
  /** The tool has reconciled with the server after a rejection. */
  clearRejection(): void;
}

/**
 * The queue's state, with a bounded retry policy actually running behind it.
 *
 * Distinct from {@link useToolPending}, which reports a NUMBER and nothing
 * else: a count cannot tell a player whether their writes are on their way,
 * waiting for a network, being retried, or dead. This can, and — because it
 * owns a scheduler — it is also what makes a failed write get tried again at
 * all, rather than waiting for the next `online` event that may never come.
 *
 * Opt-in per tool. A tool that does not call this keeps exactly its old
 * behaviour.
 */
export function useToolSync(
  namespace: string,
  options: { policy?: SyncRetryPolicy } = {},
): ToolSyncView {
  const online = useToolOnline();
  const { signedIn } = useToolSession();
  const [status, setStatus] = useState<ToolSyncStatus>(IDLE_SYNC);
  const scheduler = useRef<RetryScheduler | null>(null);

  // Read through refs inside the scheduler rather than captured values: it can
  // sit on a timer for two minutes, and a connectivity or session change in
  // that window must be seen by the attempt when it fires, not by the closure
  // that armed it.
  const live = useRef({ online, signedIn });
  live.current = { online, signedIn };

  // Read through a ref and kept OUT of the effect's deps. A caller writing the
  // natural `useToolSync(ns, { policy: { ... } })` passes a fresh object every
  // render; as a dependency that would tear down and rebuild the scheduler on
  // every render, which is an unbounded flush loop wearing a policy's clothes.
  const policy = useRef(options.policy);
  policy.current = options.policy;

  useEffect(() => {
    if (!hasToolHost()) return;
    const instance = createRetryScheduler({
      outbox: getToolHost().data.outbox(namespace),
      isOnline: () => live.current.online,
      isSignedIn: () => live.current.signedIn,
      policy: policy.current,
    });
    scheduler.current = instance;
    const unsubscribeStatus = instance.subscribe(setStatus);
    // The outbox announces its own writes; without this the status only moved
    // when the scheduler happened to wake up.
    const unsubscribeQueue = getToolHost()
      .data.outbox(namespace)
      .subscribe(() => instance.poke());
    return () => {
      unsubscribeQueue();
      unsubscribeStatus();
      instance.stop();
      scheduler.current = null;
    };
  }, [namespace]);

  // Connectivity and session changes are decisions, not just re-renders: coming
  // back online should try the queue now rather than at the end of a backoff
  // that was armed while there was no network.
  useEffect(() => {
    scheduler.current?.poke();
  }, [online, signedIn]);

  const retryNow = useCallback(async () => {
    await scheduler.current?.retryNow();
  }, []);
  const clearRejection = useCallback(() => {
    scheduler.current?.clearRejection();
  }, []);

  // Memoised, and load-bearing rather than an optimisation: a fresh object per
  // render makes this hook unusable in any dependency array, and a tool that
  // lists it in one gets an unbounded render loop rather than a warning.
  return useMemo(
    () => ({ ...status, retryNow, clearRejection }),
    [status, retryNow, clearRejection],
  );
}

export { deriveSyncStatus };
