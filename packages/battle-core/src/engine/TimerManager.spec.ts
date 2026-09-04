import { describe, it, expect, vi } from 'vitest';

import { TimerManager, type TimerState } from './TimerManager.js';

/**
 * The clock is injected, so nothing here waits on a real second. `tick()` is
 * public for the same reason: the interval is an implementation detail, the
 * arithmetic is the contract.
 */
function makeTimer(config?: { enabled?: boolean; turnMs?: number; totalMs?: number }) {
  let now = 0;
  const updates: TimerState[] = [];
  const expired: Array<'p1' | 'p2'> = [];
  const timer = new TimerManager(
    { onUpdate: (state) => updates.push(state), onExpire: (side) => expired.push(side) },
    { enabled: true, turnMs: 10_000, totalMs: 30_000, ...config },
    () => now,
  );
  return {
    timer,
    updates,
    expired,
    advance(ms: number) {
      now += ms;
    },
  };
}

describe('TimerManager', () => {
  it('is off unless a config turns it on', () => {
    const onExpire = vi.fn();
    const timer = new TimerManager({ onUpdate: vi.fn(), onExpire }, undefined, () => 0);
    expect(timer.enabled).toBe(false);
    timer.startTurn('p1');
    timer.tick();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('decrements totalRemaining as the turn runs, not only when it ends', () => {
    // The bug this replaces: `totalRemaining` was only touched in `pauseTurn`,
    // so `tick` compared it against zero every second while it never moved. A
    // player who simply never answered never ran out of total time.
    const { timer, advance } = makeTimer();
    timer.startTurn('p1');

    advance(3_000);
    timer.tick();
    expect(timer.getState().p1.totalRemaining).toBe(27_000);
    expect(timer.getState().p1.turnRemaining).toBe(7_000);

    advance(3_000);
    timer.tick();
    expect(timer.getState().p1.totalRemaining).toBe(24_000);
  });

  it('expires from ONE deadline fixed when the turn started', () => {
    const { timer, advance, expired } = makeTimer();
    timer.startTurn('p1');

    advance(9_999);
    timer.tick();
    expect(expired).toEqual([]);

    advance(1);
    timer.tick();
    expect(expired).toEqual(['p1']);
    expect(timer.getState().p1.turnRemaining).toBe(0);
    // Expiry fires once; the side stops running.
    timer.tick();
    expect(expired).toEqual(['p1']);
  });

  it('caps the turn at whatever total time is left', () => {
    const { timer, advance, expired } = makeTimer({ turnMs: 10_000, totalMs: 4_000 });
    timer.startTurn('p1');
    advance(4_000);
    timer.tick();
    expect(expired).toEqual(['p1']);
    expect(timer.getState().p1.totalRemaining).toBe(0);
  });

  it('carries the unspent total across turns', () => {
    const { timer, advance } = makeTimer();
    timer.startTurn('p1');
    advance(4_000);
    timer.pauseTurn('p1');
    expect(timer.getState().p1.totalRemaining).toBe(26_000);

    timer.startTurn('p1');
    expect(timer.getState().p1.turnRemaining).toBe(10_000);
    advance(2_000);
    timer.tick();
    expect(timer.getState().p1.totalRemaining).toBe(24_000);
  });

  it('runs both sides at once and expires only the one that ran out', () => {
    const { timer, advance, expired } = makeTimer();
    timer.startTurn('p1');
    advance(6_000);
    timer.startTurn('p2');
    advance(4_000);
    timer.tick();

    expect(expired).toEqual(['p1']);
    expect(timer.getState().p2.turnRemaining).toBe(6_000);
  });

  it('does not hand a side a fresh minute for a second request on the same turn', () => {
    // An undo makes the simulator re-emit an updated request. That is the same
    // turn, not a new one.
    const { timer, advance } = makeTimer();
    timer.startTurn('p1');
    advance(4_000);
    timer.startTurn('p1');
    timer.tick();
    expect(timer.getState().p1.turnRemaining).toBe(6_000);
  });

  it('stops cleanly', () => {
    const { timer, advance, expired } = makeTimer();
    timer.startTurn('p1');
    timer.stop();
    advance(60_000);
    timer.tick();
    expect(expired).toEqual([]);
    expect(timer.getState().activeSide).toBeNull();
  });
});
