/**
 * The backoff schedule and the terminal state.
 *
 * Both are timing logic that fails invisibly: a broken backoff still looks like
 * a working tool (it just never retries, or retries forever), and a terminal
 * state that never arrives is indistinguishable on screen from one that is
 * still trying. So the assertions here are about the timer itself — how long
 * until the next attempt, and whether one was armed at all.
 */

import { describe, expect, it, vi } from "vitest";

import {
  SYNC_RETRY,
  createRetryScheduler,
  deriveSyncStatus,
  retryDelayMs,
} from "../sync-policy";
import type {
  ToolFlushResult,
  ToolOutbox,
  ToolOutboxEntry,
  ToolOutboxRejection,
} from "../data";

const entry = (over: Partial<ToolOutboxEntry> = {}): ToolOutboxEntry => ({
  opId: "op-1",
  method: "PUT",
  path: "/tools/x/1",
  createdAt: 0,
  attempts: 0,
  lastError: null,
  ...over,
});

/** A clock and a timer queue we drive by hand — real delays here would be ten
 *  minutes of wall time to reach the terminal state. */
function fakeClock() {
  let now = 1_000_000;
  const timers: Array<{ at: number; fn: () => void; id: number }> = [];
  let nextId = 1;
  return {
    now: () => now,
    setTimer: (fn: () => void, ms: number) => {
      const id = nextId++;
      timers.push({ at: now + ms, fn, id });
      return id;
    },
    clearTimer: (handle: unknown) => {
      const i = timers.findIndex((t) => t.id === handle);
      if (i !== -1) timers.splice(i, 1);
    },
    armed: () => timers.length,
    /** Advance to the next due timer and run it. */
    async fire() {
      const next = timers.shift();
      if (!next) throw new Error("no timer armed");
      now = next.at;
      next.fn();
      // Let the flush promise chain settle before the assertions look at it.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      return next.at;
    },
    dueIn: () => (timers[0] ? timers[0].at - now : null),
  };
}

/** An outbox whose flush always fails transiently, bumping `attempts` the way
 *  both real implementations do. */
function failingOutbox(): ToolOutbox & { flushes: number } {
  let queued = [entry()];
  const box = {
    flushes: 0,
    async enqueue() {
      return "op-1";
    },
    async pending() {
      return queued;
    },
    async flush(): Promise<ToolFlushResult> {
      box.flushes += 1;
      queued = [
        { ...queued[0], attempts: queued[0].attempts + 1, lastError: "503" },
      ];
      return { sent: 0, rejected: [], remaining: 1, stopped: "503" };
    },
    subscribe() {
      return () => {};
    },
  };
  return box;
}

const settle = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe("retryDelayMs", () => {
  it("backs off exponentially from the first failure", () => {
    expect(retryDelayMs(0)).toBe(5_000);
    expect(retryDelayMs(1)).toBe(5_000);
    expect(retryDelayMs(2)).toBe(10_000);
    expect(retryDelayMs(3)).toBe(20_000);
    expect(retryDelayMs(4)).toBe(40_000);
  });

  it("is bounded, so a long outage settles into a poll", () => {
    expect(retryDelayMs(99)).toBe(SYNC_RETRY.maxDelayMs);
  });
});

describe("deriveSyncStatus", () => {
  const base = { signedIn: true, online: true, flushing: false, pending: [] };

  it("calls an empty queue synced", () => {
    expect(deriveSyncStatus(base).state).toBe("synced");
  });

  it("never warns a signed-out player, who is not waiting for anything", () => {
    expect(
      deriveSyncStatus({ ...base, signedIn: false, pending: [entry({ attempts: 5 })] })
        .state,
    ).toBe("local-only");
  });

  it("separates a first attempt from a retry", () => {
    expect(deriveSyncStatus({ ...base, pending: [entry()] }).state).toBe("queued");
    expect(
      deriveSyncStatus({ ...base, pending: [entry({ attempts: 2 })] }).state,
    ).toBe("retrying");
  });

  it("goes terminal once the attempts are spent, instead of retrying forever", () => {
    const status = deriveSyncStatus({
      ...base,
      pending: [entry({ attempts: SYNC_RETRY.maxAttempts })],
    });
    expect(status.state).toBe("stuck");
    // No countdown, because there is no next attempt to count down to. This is
    // the whole point: a stuck queue must not be able to look like a live one.
    expect(status.retryInMs).toBeNull();
  });

  it("offers no countdown while offline", () => {
    const status = deriveSyncStatus({
      ...base,
      online: false,
      pending: [entry({ attempts: 1 })],
      nextAttemptAt: 999,
    });
    expect(status.state).toBe("retrying");
    expect(status.retryInMs).toBeNull();
  });

  it("counts down to the scheduled attempt", () => {
    const status = deriveSyncStatus({
      ...base,
      pending: [entry({ attempts: 1 })],
      nextAttemptAt: 10_000,
      now: 7_500,
    });
    expect(status.retryInMs).toBe(2_500);
  });

  it("puts a permanent refusal above every other state", () => {
    const rejection: ToolOutboxRejection = {
      opId: "op-1",
      path: "/x",
      status: 422,
      message: "nope",
    };
    const status = deriveSyncStatus({ ...base, flushing: true, rejection });
    expect(status.state).toBe("rejected");
    expect(status.rejection).toBe(rejection);
  });
});

describe("createRetryScheduler", () => {
  it("arms the next attempt on the backoff schedule and stops at the cap", async () => {
    const clock = fakeClock();
    const outbox = failingOutbox();
    const scheduler = createRetryScheduler({
      outbox,
      isOnline: () => true,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();

    // First attempt: base delay, because nothing has failed yet.
    expect(clock.dueIn()).toBe(5_000);

    const seen: number[] = [];
    for (let i = 0; i < SYNC_RETRY.maxAttempts; i++) {
      await clock.fire();
      const due = clock.dueIn();
      if (due !== null) seen.push(due);
    }

    expect(outbox.flushes).toBe(SYNC_RETRY.maxAttempts);
    expect(seen.slice(0, 4)).toEqual([5_000, 10_000, 20_000, 40_000]);
    // The assertion that matters: nothing is armed any more. A scheduler that
    // kept a timer here is exactly "spinning forever".
    expect(clock.armed()).toBe(0);
    expect(scheduler.status().state).toBe("stuck");
    scheduler.stop();
  });

  it("lets an explicit retry escape the terminal state", async () => {
    const clock = fakeClock();
    const outbox = failingOutbox();
    const scheduler = createRetryScheduler({
      outbox,
      isOnline: () => true,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();
    for (let i = 0; i < SYNC_RETRY.maxAttempts; i++) await clock.fire();
    expect(scheduler.status().state).toBe("stuck");

    const before = outbox.flushes;
    await scheduler.retryNow();
    await settle();

    // `attempts` lives in storage and only a success clears it, so without the
    // one-shot override a player could never get out of `stuck`.
    expect(outbox.flushes).toBe(before + 1);
    scheduler.stop();
  });

  it("arms nothing while offline, and nothing while signed out", async () => {
    const clock = fakeClock();
    let online = false;
    const scheduler = createRetryScheduler({
      outbox: failingOutbox(),
      isOnline: () => online,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();
    expect(clock.armed()).toBe(0);
    expect(scheduler.status().state).toBe("queued");

    // A poke on reconnect is what turns the network coming back into an attempt.
    online = true;
    scheduler.poke();
    await settle();
    expect(clock.armed()).toBe(1);
    scheduler.stop();
  });

  it("stops retrying and reports a permanent refusal instead", async () => {
    const clock = fakeClock();
    const rejection: ToolOutboxRejection = {
      opId: "op-1",
      path: "/x",
      status: 422,
      message: "unprocessable",
    };
    let queued = [entry()];
    const outbox: ToolOutbox = {
      enqueue: async () => "op-1",
      pending: async () => queued,
      flush: async () => {
        queued = [];
        return { sent: 0, rejected: [rejection], remaining: 0, stopped: null };
      },
      subscribe: () => () => {},
    };
    const scheduler = createRetryScheduler({
      outbox,
      isOnline: () => true,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();
    await clock.fire();

    expect(scheduler.status().state).toBe("rejected");
    expect(scheduler.status().rejection).toEqual(rejection);
    // A refused write is not retried: the server has decided.
    expect(clock.armed()).toBe(0);

    // …until the tool says it has reconciled.
    scheduler.clearRejection();
    await settle();
    expect(scheduler.status().state).toBe("synced");
    scheduler.stop();
  });

  it("stops dead when told to, leaving no timer behind", async () => {
    const clock = fakeClock();
    const scheduler = createRetryScheduler({
      outbox: failingOutbox(),
      isOnline: () => true,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();
    expect(clock.armed()).toBe(1);
    scheduler.stop();
    expect(clock.armed()).toBe(0);
  });

  it("notifies subscribers with the current status on subscribe", async () => {
    const clock = fakeClock();
    const scheduler = createRetryScheduler({
      outbox: failingOutbox(),
      isOnline: () => true,
      isSignedIn: () => true,
      ...clock,
    });
    await settle();
    const listener = vi.fn();
    scheduler.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].state).toBe("queued");
    scheduler.stop();
  });
});
