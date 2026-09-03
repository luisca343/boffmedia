"use client";

/**
 * The tracker's sync, on `@boffmedia/tool-kit`'s outbox.
 *
 * The contract this exposes is unchanged — `pushChange`, `syncStatus`,
 * `conflictMessage`, `refreshNow`, `lastSyncAt` — so every screen that consumes
 * it moved across untouched. What is gone is the machinery underneath: a
 * `trackerOutbox` Dexie table, an exponential-backoff calculator, a 10-second
 * polling interval and a `window.addEventListener('online')`. The kit's queue
 * does all four, in Rust on the desktop, and it survives a reload there.
 *
 * The rules that ARE still spelled out here, because they are the tracker's and
 * not the queue's:
 *
 * * **Parent-first, but only once.** A match and a series carry an FK to their
 *   session, so the session has to reach the server first. A dedupe MOVES an op
 *   to the back of the queue in both hosts (IndexedDB deletes and re-inserts;
 *   SQLite takes a new `created_at`), so re-queueing the parent on every child
 *   write pushed the parent BEHIND children already waiting on it — and the
 *   server answered those with a 404 the kit then treated as permanent. The
 *   parent is only enqueued when it is not already pending.
 * * **One flush at a time.** Every write calls `flush`, and two overlapping
 *   runs walk the same rows: the loser re-sends a DELETE the winner already
 *   completed and gets a 404 back, which surfaced as "the server rejected a
 *   change" for a delete that worked perfectly.
 * * **A conflict is not a retry.** A 409 means the server has newer data, so
 *   replaying the op would only lose it again. The kit already treats a 4xx as
 *   a permanent rejection and drops it; this reads those rejections and puts
 *   the tool into `conflict`, where `pushChange` stops queueing until the user
 *   refreshes — and `refreshNow` now actually RESOLVES it, by taking the
 *   server's version of any row this device has no pending write for.
 * * **Signed out is not an error.** With no account there is no queue at all —
 *   local writes still happen (that is `useVgcDb`), so the tracker is fully
 *   usable, it just has nowhere to sync to. The status says `offline`.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { toast } from "@boffmedia/ui";
import { toolOutbox, toolStorage, useToolOnline, useToolSession } from "@boffmedia/tool-kit";

import {
  claimAnonymousData,
  hasAnonymousData,
  setTrackerOwner,
  trackerNamespace,
  vgcDb,
  type SyncTable,
} from "../db";
import {
  deleteOp,
  matchOp,
  presetOp,
  seriesOp,
  sessionOp,
  syncPull,
} from "../../tracker-service";
import { useVgcT } from "../../i18n";
import type { Match, Series, Session, TeamPreset } from "../types";

export type { SyncTable };
export type SyncStatus = "idle" | "syncing" | "error" | "offline" | "conflict";

type SyncEntity = Session | Match | Series | TeamPreset;

/** How long to wait before retrying after the server failed us. */
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 120_000;

interface TrackerSyncContextValue {
  /** Call after every write. Pass null for data to trigger a DELETE on the server. */
  pushChange: (table: SyncTable, id: string, data: SyncEntity | null) => void;
  syncStatus: SyncStatus;
  conflictMessage: string | null;
  refreshNow: () => Promise<boolean>;
  /** Increments after each successful pull so hooks know to re-query the store. */
  lastSyncAt: number;
  /** Writes this device still owes the server. */
  pendingCount: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const TrackerSyncContext = createContext<TrackerSyncContextValue>({
  pushChange: () => {},
  syncStatus: "offline",
  conflictMessage: null,
  refreshNow: async () => false,
  lastSyncAt: 0,
  pendingCount: 0,
});

export function useTrackerSync() {
  return useContext(TrackerSyncContext);
}

/** Build the write op for one table. `null` data means a delete. */
function opFor(table: SyncTable, id: string, data: SyncEntity | null) {
  if (data === null) return deleteOp(table, id);
  if (table === "sessions") return sessionOp(data as Session);
  if (table === "matches") return matchOp(data as Match);
  if (table === "series") return seriesOp(data as Series);
  return presetOp(data as TeamPreset);
}

/** Rows the queue still owes the server, as `<table>:<id>` dedupe keys. */
async function pendingKeys(): Promise<Set<string>> {
  const ops = await toolOutbox(trackerNamespace()).pending();
  return new Set(ops.map((op) => op.dedupeKey).filter((k): k is string => !!k));
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function TrackerSyncProvider({ children }: { children: React.ReactNode }) {
  const t = useVgcT("tracker");
  const { user, status } = useToolSession();
  const online = useToolOnline();
  const owner = user?.id != null ? String(user.id) : null;
  const signedIn = owner !== null;

  // Point the store at this account BEFORE any child renders. Children render
  // after their parent, so an assignment here is seen by every `vgcDb` call
  // they make; a layout effect would not be, because child effects run first.
  // Scoping matters for more than tidiness: one shared store handed a new
  // account the previous player's sessions and then uploaded them.
  setTrackerOwner(owner);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [claimPrompt, setClaimPrompt] = useState<string | null>(null);

  // `pushChange` must not be recreated on every status change (it is a
  // dependency of every write hook), so it reads these through refs.
  const signedInRef = useRef(signedIn);
  const onlineRef = useRef(online);
  const conflictedRef = useRef(false);
  const tRef = useRef(t);
  useEffect(() => { signedInRef.current = signedIn; }, [signedIn]);
  useEffect(() => { onlineRef.current = online; }, [online]);
  useEffect(() => { conflictedRef.current = syncStatus === "conflict"; }, [syncStatus]);
  // The translator is held in a ref rather than listed as a dependency: it is
  // rebuilt whenever the locale changes, and putting it in the dependency chain
  // of `flush` -> the pull effect is what made that effect re-run and re-pull.
  useEffect(() => { tRef.current = t; }, [t]);

  const refreshPending = useCallback(async () => {
    if (!signedInRef.current) { setPendingCount(0); return; }
    setPendingCount((await toolOutbox(trackerNamespace()).pending()).length);
  }, []);

  // ── One flush at a time ───────────────────────────────────────────────────
  // A promise chain rather than a boolean: a caller that drops its flush
  // because another was running would return before its own op was sent, and
  // "saved" has to mean the queue was actually walked after this write.
  const flushChain = useRef<Promise<void>>(Promise.resolve());

  const runFlush = useCallback(async () => {
    if (!signedInRef.current) return;
    // Offline is a resting state, not a failure: the ops are queued, the screen
    // is rendering from the local store, and the badge hides itself. Flushing
    // anyway would paint a red "sync error" over a tracker that is working.
    if (!onlineRef.current) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus("syncing");
    let result;
    try {
      result = await toolOutbox(trackerNamespace()).flush();
    } catch {
      // The queue itself failed — a broken IndexedDB, a dead IPC bridge. There
      // is nothing to report per-op and nothing to retry right now, but the
      // badge must not sit on "syncing" forever pretending work is in flight.
      setSyncStatus("error");
      return;
    }
    await refreshPending().catch(() => {});

    const tr = tRef.current;
    const conflict = result.rejected.find((r) => r.status === 409);
    if (conflict) {
      setConflictMessage(tr("sync.conflictBody"));
      setSyncStatus("conflict");
      return;
    }

    // A DELETE the server answers with 404 is a delete that already happened —
    // the row is gone, which is the whole point of the request. Reporting it as
    // a rejection told the player a change had failed when nothing had.
    const real = result.rejected.filter(
      (r) => !(r.status === 404 && r.path.includes("?clientDeletedAt=")),
    );
    if (real.length) {
      setSyncStatus("error");
      toast.error(tr("sync.rejected", { detail: real[0].message }));
      return;
    }

    // `stopped` covers two very different things — the connection went away
    // mid-run, or the server is failing. Only the second deserves red.
    setSyncStatus(result.stopped ? (onlineRef.current ? "error" : "offline") : "idle");
  }, [refreshPending]);

  const flush = useCallback(async () => {
    const next = flushChain.current.then(runFlush, runFlush);
    flushChain.current = next.catch(() => {});
    return next;
  }, [runFlush]);

  /**
   * Reconcile the local store with the server's.
   *
   * Three kinds of row, and the pending queue decides two of them:
   *
   * * The server has it and this device has no pending write for it — the
   *   server's copy wins. This is the half that was missing: without it a
   *   conflict could never clear, because "refresh from cloud" left the stale
   *   row exactly as it was and the next save 409'd again forever.
   * * The server has DELETED it — drop it locally. A row absent from the server
   *   used to be indistinguishable from one never uploaded, so deletes came
   *   back from whichever device had been offline for them.
   * * This device has it and the server does not, and it is not a tombstone —
   *   queue it. That is how work recorded before signing in reaches the cloud.
   *
   * A row with a pending write is never touched: its local version is newer by
   * definition, and overwriting it from a snapshot taken before the queue
   * drained is the exact loss `dedupeKey` exists to prevent.
   */
  const pullAndMerge = useCallback(async () => {
    const remote = await syncPull();
    if (!remote) return;

    const [localSessions, localMatches, localSeries, localPresets] = await Promise.all([
      vgcDb.sessions.all(),
      vgcDb.matches.all(),
      vgcDb.series.all(),
      vgcDb.presets.all(),
    ]);
    const pending = await pendingKeys();
    const outbox = toolOutbox(trackerNamespace());

    /** Server rows this device should take verbatim. */
    const toAdopt = <T extends Versioned>(
      table: SyncTable,
      local: T[],
      server: T[],
    ): T[] => {
      const byId = new Map(local.map((r) => [r.id, r]));
      return server.filter((row) => {
        if (pending.has(`${table}:${row.id}`)) return false;
        const mine = byId.get(row.id);
        if (!mine) return true;
        // Same version on both sides is the common case — skip the write.
        return versionOf(row) !== versionOf(mine);
      });
    };

    await vgcDb.sessions.adopt(toAdopt("sessions", localSessions, remote.sessions as Session[]));
    await vgcDb.matches.adopt(toAdopt("matches", localMatches, remote.matches as Match[]));
    await vgcDb.series.adopt(toAdopt("series", localSeries, remote.series as Series[]));
    await vgcDb.presets.adopt(toAdopt("presets", localPresets, remote.presets as TeamPreset[]));

    // Tombstones. A row this device is mid-edit keeps its pending write, which
    // the server resolves on arrival (a later edit resurrects it; an earlier
    // one comes back as a conflict).
    const deleted = remote.deleted ?? { sessions: [], matches: [], series: [], presets: [] };
    const applyDeletes = async (table: SyncTable, ids: string[]) => {
      for (const id of ids) {
        if (pending.has(`${table}:${id}`)) continue;
        await vgcDb[table].remove(id);
      }
    };
    await applyDeletes("matches", deleted.matches ?? []);
    await applyDeletes("series", deleted.series ?? []);
    await applyDeletes("sessions", deleted.sessions ?? []);
    await applyDeletes("presets", deleted.presets ?? []);

    // Local-only work, pushed parent-first so every FK resolves on arrival.
    const gone = {
      sessions: new Set(deleted.sessions ?? []),
      matches: new Set(deleted.matches ?? []),
      series: new Set(deleted.series ?? []),
      presets: new Set(deleted.presets ?? []),
    };
    const onServer = {
      sessions: new Set(remote.sessions.map((r) => r.id)),
      matches: new Set(remote.matches.map((r) => r.id)),
      series: new Set(remote.series.map((r) => r.id)),
      presets: new Set(remote.presets.map((r) => r.id)),
    };
    const localOnly = <T extends { id: string }>(table: SyncTable, rows: T[]) =>
      rows.filter(
        (r) => !onServer[table].has(r.id) && !gone[table].has(r.id) && !pending.has(`${table}:${r.id}`),
      );

    for (const row of localOnly("sessions", localSessions)) await outbox.enqueue(sessionOp(row));
    for (const row of localOnly("matches", localMatches)) await outbox.enqueue(matchOp(row));
    for (const row of localOnly("series", localSeries)) await outbox.enqueue(seriesOp(row));
    for (const row of localOnly("presets", localPresets)) await outbox.enqueue(presetOp(row));
  }, []);

  const refreshNow = useCallback(async () => {
    if (!signedInRef.current) return false;

    setConflictMessage(null);
    setSyncStatus("syncing");
    try {
      await pullAndMerge();
      setLastSyncAt(Date.now());
      await flush();
      toast.success(tRef.current("sync.refreshed"));
      return true;
    } catch {
      setSyncStatus("error");
      return false;
    }
  }, [pullAndMerge, flush]);

  // ─── Pull on sign-in, and whenever the connection comes back ───────────────

  useEffect(() => {
    if (status === "loading") return;
    if (!signedIn) {
      setSyncStatus("offline");
      setConflictMessage(null);
      setPendingCount(0);
      // The owner changed, so every hook reading the store has stale rows.
      setLastSyncAt(Date.now());
      return;
    }
    setLastSyncAt(Date.now());
    if (!online) {
      // Not an error: the queue is intact and the screen is rendering from the
      // local store, which is complete.
      setSyncStatus("offline");
      return;
    }

    let cancelled = false;
    setSyncStatus("syncing");
    setConflictMessage(null);

    pullAndMerge()
      .then(async () => {
        if (cancelled) return;
        setLastSyncAt(Date.now());
        await flush();
      })
      .catch(() => {
        if (!cancelled) setSyncStatus("error");
      });

    return () => { cancelled = true; };
    // `owner`, not `signedIn`: switching accounts on one device has to re-pull.
  }, [status, owner, signedIn, online, pullAndMerge, flush]);

  // ─── Retry after the server failed ────────────────────────────────────────
  //
  // The kit replays on reconnect, which covers losing the connection but not a
  // server that is up and erroring: a single 500 left the badge red until the
  // player happened to write again. Backs off so a sustained outage is not a
  // request every five seconds.
  const failures = useRef(0);
  useEffect(() => {
    // Only a SUCCESS clears the count. Resetting on anything that is not
    // "error" looks right and is not: a retry passes through "syncing" on its
    // way back to "error", so the counter was cleared every round and the
    // backoff never grew past its first step.
    if (syncStatus === "idle") {
      failures.current = 0;
      return;
    }
    if (syncStatus !== "error" || !signedIn || !online) return;
    const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** failures.current);
    failures.current += 1;
    const timer = setTimeout(() => { void flush(); }, delay);
    return () => clearTimeout(timer);
  }, [syncStatus, signedIn, online, flush]);

  // ─── Keep the pending count honest ────────────────────────────────────────

  useEffect(() => {
    if (!signedIn) return;
    void refreshPending();
    return toolOutbox(trackerNamespace()).subscribe((count) => setPendingCount(count));
  }, [signedIn, owner, refreshPending]);

  // ─── Offer to bring signed-out work into the account ──────────────────────

  useEffect(() => {
    if (!signedIn || !owner) return;
    let cancelled = false;
    void (async () => {
      if (await claimAlreadyAnswered(owner)) return;
      if (!(await hasAnonymousData())) return;
      if (!cancelled) setClaimPrompt(owner);
    })();
    return () => { cancelled = true; };
  }, [signedIn, owner]);

  const resolveClaim = useCallback(
    async (accept: boolean) => {
      const target = claimPrompt;
      setClaimPrompt(null);
      if (!target) return;
      await rememberClaimAnswer(target);
      if (!accept) return;
      await claimAnonymousData(target);
      setLastSyncAt(Date.now());
      // A claim writes rows locally but queues nothing — `pullAndMerge` is what
      // notices they are local-only and enqueues them. Without this the import
      // sat on the device until the next reconnect or manual refresh, which for
      // someone who just chose "import into my account" reads as it not working.
      await pullAndMerge().catch(() => {});
      await flush();
    },
    [claimPrompt, pullAndMerge, flush],
  );

  // ─── Push individual changes ───────────────────────────────────────────────

  const pushChange = useCallback(
    (table: SyncTable, id: string, data: SyncEntity | null) => {
      // No account: the local write already happened and there is nothing to
      // owe anyone. In conflict: the server has newer data, so queueing more
      // would just widen the gap — the user refreshes first.
      if (!signedInRef.current || conflictedRef.current) return;

      void (async () => {
        const outbox = toolOutbox(trackerNamespace());
        // Parent-first — but ONLY if the session is not already queued.
        // Re-enqueuing moves an op to the back of the queue, so doing it
        // unconditionally pushed the parent behind the children waiting on it.
        if (data && (table === "matches" || table === "series")) {
          const parentId = (data as Match | Series).sessionId;
          if (!(await pendingKeys()).has(`sessions:${parentId}`)) {
            const parent = await vgcDb.sessions.get(parentId);
            if (parent) await outbox.enqueue(sessionOp(parent));
          }
        }
        await outbox.enqueue(opFor(table, id, data));
        await flush();
      })().catch(() => {
        // Queueing failed, so this write is owed to the server and nothing is
        // tracking it. Said on the badge rather than left to the console.
        setSyncStatus("error");
      });
    },
    [flush],
  );

  return (
    <TrackerSyncContext.Provider
      value={{ pushChange, syncStatus, conflictMessage, refreshNow, lastSyncAt, pendingCount }}
    >
      {children}
      {claimPrompt && <ClaimAnonymousDialog onResolve={resolveClaim} />}
    </TrackerSyncContext.Provider>
  );
}

/** Anything with an id and a client-clock version. */
type Versioned = { id: string; updatedAt?: number; clientUpdatedAt?: number };

/**
 * The version two copies of a row are compared by.
 *
 * `clientUpdatedAt` first: it is the stamp of the device that wrote the row,
 * which is what both sides mean by "when". `updatedAt` is the local fallback
 * for a row that has never round-tripped through the server.
 */
function versionOf(row: Versioned): number {
  return row.clientUpdatedAt ?? row.updatedAt ?? 0;
}

// ─── The claim prompt ────────────────────────────────────────────────────────
//
// Asked once per account and remembered, because the honest answer depends on
// something only the player knows: whether the signed-out sessions on this
// machine are theirs. Auto-claiming is wrong on a shared computer and silently
// discarding is wrong for someone who tracked a whole tournament before making
// an account.

// `storage`, not the durable store: this is a preference about a dialog, and
// losing it means asking once more rather than losing data.
const CLAIM_KEY = "vgc-tracker:claim-answered";

async function answeredAccounts(): Promise<string[]> {
  const stored = await toolStorage().get<string[]>(CLAIM_KEY);
  return Array.isArray(stored) ? stored : [];
}

async function claimAlreadyAnswered(owner: string): Promise<boolean> {
  return (await answeredAccounts()).includes(owner);
}

async function rememberClaimAnswer(owner: string): Promise<void> {
  const answered = await answeredAccounts();
  if (answered.includes(owner)) return;
  await toolStorage().set(CLAIM_KEY, [...answered, owner]);
}

function ClaimAnonymousDialog({ onResolve }: { onResolve: (accept: boolean) => void }) {
  const t = useVgcT("tracker");
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4">
      <div className="grid max-w-[26.25rem] gap-3 border border-solid border-line-2 bg-panel p-5 shadow-[var(--shadow)]">
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-accent-bright">
          {t("claim.title")}
        </p>
        <p className="font-body text-[0.8125rem] leading-[1.55] text-txt-muted">{t("claim.body")}</p>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="border border-solid border-line-2 bg-base px-3 py-[0.4375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-txt-muted transition-colors hover:text-txt"
          >
            {t("claim.keepSeparate")}
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className="border border-solid border-accent-line bg-accent px-3 py-[0.4375rem] font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
          >
            {t("claim.import")}
          </button>
        </div>
      </div>
    </div>
  );
}
