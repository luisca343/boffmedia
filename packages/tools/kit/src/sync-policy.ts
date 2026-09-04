/**
 * When a queued write is tried again, and when the tool stops pretending it
 * will ever succeed.
 *
 * The outbox already stores everything a retry policy needs — `attempts` and
 * `lastError` are on every entry — but nothing anywhere DECIDED anything with
 * them. Until this module, the whole of the kit's retry behaviour was one
 * `window.addEventListener("online")`: a queue that failed against a reachable
 * server (a 500, a proxy timeout) simply sat there until the player happened to
 * write again, and a queue that could never succeed sat there identically.
 * Those are two different situations and a player deserves to be told which
 * one they are in.
 *
 * Two halves, deliberately separable:
 *
 * * {@link deriveSyncStatus} is a pure function — the vocabulary, testable
 *   without timers, and usable by a surface that wants to keep its own
 *   scheduling.
 * * {@link createRetryScheduler} owns the clock. Opt-in: nothing retries
 *   because this module exists, only because a tool asked it to.
 *
 * Deliberately NOT here: any change to `ToolOutbox`. Its two implementations
 * (IndexedDB on the web, SQLite replayed by Rust on the desktop) would then have
 * to move together, and this whole policy can be derived from what they already
 * record.
 */

import type { ToolOutbox, ToolOutboxEntry, ToolOutboxRejection } from "./data";

export interface SyncRetryPolicy {
  /** Delay before the first retry. */
  baseDelayMs: number;
  /** Multiplier per failed attempt. */
  factor: number;
  /** Ceiling, so a long outage settles into a poll rather than an hour-long gap. */
  maxDelayMs: number;
  /**
   * After this many failed attempts the queue is declared stuck and the timer
   * STOPS.
   *
   * A cap and not "retry forever" because forever is indistinguishable, from
   * the outside, from a tool that is working — which is precisely the
   * complaint. Eight attempts at this schedule is roughly ten minutes of
   * trying, which is long enough to ride out a deploy and short enough that a
   * genuinely broken write gets said out loud.
   */
  maxAttempts: number;
}

export const SYNC_RETRY: SyncRetryPolicy = {
  baseDelayMs: 5_000,
  factor: 2,
  maxDelayMs: 120_000,
  maxAttempts: 8,
};

/**
 * Delay before the attempt that follows `attempts` failures.
 *
 * No jitter: these are per-device queues drained one at a time, not a herd of
 * clients hitting one endpoint on a shared schedule, and a deterministic delay
 * is one a test can assert and a UI can count down honestly.
 */
export function retryDelayMs(
  attempts: number,
  policy: SyncRetryPolicy = SYNC_RETRY,
): number {
  const steps = Math.max(0, attempts - 1);
  const delay = policy.baseDelayMs * Math.pow(policy.factor, steps);
  return Math.min(delay, policy.maxDelayMs);
}

/**
 * What the player is told.
 *
 * `stuck` is the state that did not exist before and is the reason this file
 * does: a queue that has run out of attempts, is NOT going to move on its own,
 * and says so instead of showing a spinner forever.
 */
export type ToolSyncState =
  | "local-only"
  | "synced"
  | "syncing"
  | "queued"
  | "retrying"
  | "stuck"
  | "rejected";

export interface ToolSyncStatus {
  state: ToolSyncState;
  /** Writes still owed to the server. */
  pending: number;
  /** Failed attempts on the op at the head of the queue — the one blocking it. */
  attempts: number;
  /** Machine text from the last failure. Render it as detail, never as the
   *  whole message: it is an HTTP error, not a sentence for a player. */
  lastError: string | null;
  /** ms until the next automatic attempt, or `null` when there will not be one
   *  (nothing queued, offline, or given up). */
  retryInMs: number | null;
  /** The last write the server refused for good. Its local counterpart is a
   *  lie until the tool reconciles, which is why this outranks everything. */
  rejection: ToolOutboxRejection | null;
}

export interface DeriveSyncStatusInput {
  signedIn: boolean;
  online: boolean;
  /** A flush is in flight right now. */
  flushing: boolean;
  pending: ToolOutboxEntry[];
  /** Set once a flush reports a permanent refusal; cleared when the tool has
   *  reconciled. */
  rejection?: ToolOutboxRejection | null;
  /** Epoch ms of the next scheduled attempt, from the scheduler. */
  nextAttemptAt?: number | null;
  now?: number;
  policy?: SyncRetryPolicy;
}

/**
 * The whole state machine, as one pure function.
 *
 * Order is the design. A rejection outranks everything because it is the only
 * state where the screen is showing something the server does not have and
 * never will; "signed out" outranks the queue because a signed-out player is
 * not waiting for anything; and `stuck` outranks `retrying` so a dead queue can
 * never present itself as a live one.
 */
export function deriveSyncStatus(input: DeriveSyncStatusInput): ToolSyncStatus {
  const {
    signedIn,
    online,
    flushing,
    pending,
    rejection = null,
    nextAttemptAt = null,
    now = Date.now(),
    policy = SYNC_RETRY,
  } = input;

  const head = pending[0];
  const attempts = head?.attempts ?? 0;
  const lastError = head?.lastError ?? null;
  const base = { pending: pending.length, attempts, lastError, rejection };

  if (rejection) return { ...base, state: "rejected", retryInMs: null };
  // Signed out is not a sync problem. Local-only work is the documented,
  // supported way to use these tools, so it must never wear a warning colour.
  if (!signedIn) return { ...base, state: "local-only", retryInMs: null };
  if (pending.length === 0) return { ...base, state: "synced", retryInMs: null };
  if (flushing) return { ...base, state: "syncing", retryInMs: null };

  if (attempts >= policy.maxAttempts) {
    return { ...base, state: "stuck", retryInMs: null };
  }

  // Offline is `queued`, never `retrying`: there is no attempt to count down to
  // while the network is gone, and showing one would be a countdown to nothing.
  const retryInMs =
    online && nextAttemptAt !== null ? Math.max(0, nextAttemptAt - now) : null;

  return {
    ...base,
    state: attempts > 0 ? "retrying" : "queued",
    retryInMs,
  };
}

/* ── the scheduler ─────────────────────────────────────────────────────────── */

export interface RetrySchedulerOptions {
  outbox: ToolOutbox;
  /** Read at decision time rather than passed once: connectivity changes under
   *  a scheduler that may be waiting minutes. */
  isOnline: () => boolean;
  isSignedIn: () => boolean;
  policy?: SyncRetryPolicy;
  /** Injectable clock and timers, so the backoff can be tested without waiting
   *  ten real minutes for the terminal state. */
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface RetryScheduler {
  /** Re-read the queue and (re)arm the timer. Call after a write, after the
   *  session changes, and when connectivity changes. */
  poke(): void;
  status(): ToolSyncStatus;
  subscribe(listener: (status: ToolSyncStatus) => void): () => void;
  /**
   * Try immediately, ignoring the attempt cap once.
   *
   * This is what a "Retry" button calls. The cap has to be overridable or
   * `stuck` would be a trap: the entry's `attempts` lives in storage and only a
   * success clears it, so without this a player could never get out of it.
   */
  retryNow(): Promise<void>;
  /** The tool reconciled after a rejection; stop showing it. */
  clearRejection(): void;
  stop(): void;
}

export function createRetryScheduler(
  options: RetrySchedulerOptions,
): RetryScheduler {
  const {
    outbox,
    isOnline,
    isSignedIn,
    policy = SYNC_RETRY,
    now = () => Date.now(),
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = options;

  const listeners = new Set<(status: ToolSyncStatus) => void>();
  let timer: unknown = null;
  let pending: ToolOutboxEntry[] = [];
  let rejection: ToolOutboxRejection | null = null;
  let nextAttemptAt: number | null = null;
  let flushing = false;
  let stopped = false;
  /** Lets exactly one attempt through past the cap. See `retryNow`. */
  let override = false;

  const status = (): ToolSyncStatus =>
    deriveSyncStatus({
      signedIn: isSignedIn(),
      online: isOnline(),
      flushing,
      pending,
      rejection,
      nextAttemptAt,
      now: now(),
      policy,
    });

  const announce = () => {
    const snapshot = status();
    for (const listener of listeners) listener(snapshot);
  };

  const disarm = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    nextAttemptAt = null;
  };

  async function attempt(): Promise<void> {
    if (stopped || flushing) return;
    timer = null;
    nextAttemptAt = null;
    flushing = true;
    announce();
    try {
      const result = await outbox.flush();
      // Only the FIRST rejection is kept: they all mean the same thing to the
      // tool ("reconcile"), and a queue of them would only ever be read once.
      if (result.rejected.length > 0) rejection = result.rejected[0];
    } catch {
      // A flush that throws is the same situation as one that stops: the queue
      // is unchanged, and the reload below picks the new attempt count up.
    } finally {
      flushing = false;
      override = false;
    }
    await reload();
  }

  async function reload(): Promise<void> {
    if (stopped) return;
    try {
      pending = await outbox.pending();
    } catch {
      pending = [];
    }
    schedule();
    announce();
  }

  function schedule(): void {
    disarm();
    if (stopped || flushing) return;
    if (pending.length === 0 || rejection) return;
    if (!isSignedIn() || !isOnline()) return;

    const attempts = pending[0]?.attempts ?? 0;
    // The terminal state. Arming a timer here is what "spinning forever" means
    // in practice, so the one thing this branch must not do is arm a timer.
    if (attempts >= policy.maxAttempts && !override) return;

    const delay = override ? 0 : retryDelayMs(attempts, policy);
    nextAttemptAt = now() + delay;
    timer = setTimer(() => {
      void attempt();
    }, delay);
  }

  void reload();

  return {
    poke() {
      void reload();
    },
    status,
    subscribe(listener) {
      listeners.add(listener);
      listener(status());
      return () => listeners.delete(listener);
    },
    async retryNow() {
      override = true;
      disarm();
      await attempt();
    },
    clearRejection() {
      rejection = null;
      void reload();
    },
    stop() {
      stopped = true;
      disarm();
      listeners.clear();
    },
  };
}
