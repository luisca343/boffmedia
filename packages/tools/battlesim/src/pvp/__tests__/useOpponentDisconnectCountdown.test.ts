/**
 * Live countdown for opponent disconnect grace period.
 *
 * Tests that the countdown derives from expiresAt (server time) and updates
 * without drifting when the tab is backgrounded.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOpponentDisconnectCountdown } from '../useOpponentDisconnectCountdown';

describe('useOpponentDisconnectCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when disconnect state is null', () => {
    const { result } = renderHook(() => useOpponentDisconnectCountdown(null));
    expect(result.current).toBeNull();
  });

  it('derives countdown from expiresAt (server time) not local decrement', () => {
    const now = Date.now();
    const expiresAt = now + 5000; // 5 seconds from now

    vi.setSystemTime(now);
    const { result } = renderHook(() =>
      useOpponentDisconnectCountdown({ graceDurationMs: 5000, expiresAt })
    );

    expect(result.current).toBe(5);
  });

  it('updates countdown as time passes', () => {
    const now = Date.now();
    const expiresAt = now + 5000;

    vi.setSystemTime(now);
    const { result, rerender } = renderHook(
      ({ disconnect }) =>
        useOpponentDisconnectCountdown(disconnect),
      { initialProps: { disconnect: { graceDurationMs: 5000, expiresAt } } }
    );

    expect(result.current).toBe(5);

    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    vi.setSystemTime(now + 1000);
    rerender({ disconnect: { graceDurationMs: 5000, expiresAt } });

    expect(result.current).toBe(4);

    // Advance time by another 2 seconds
    vi.advanceTimersByTime(2000);
    vi.setSystemTime(now + 3000);
    rerender({ disconnect: { graceDurationMs: 5000, expiresAt } });

    expect(result.current).toBe(2);
  });

  it('clears interval when disconnect state is cleared', () => {
    const now = Date.now();
    const expiresAt = now + 5000;

    vi.setSystemTime(now);
    const { result, rerender } = renderHook(
      ({ disconnect }: { disconnect: { graceDurationMs: number; expiresAt: number } | null }) =>
        useOpponentDisconnectCountdown(disconnect),
      { initialProps: { disconnect: { graceDurationMs: 5000, expiresAt } as any } }
    );

    expect(result.current).toBe(5);

    rerender({ disconnect: null });
    expect(result.current).toBeNull();
  });

  it('calls onExpired when countdown reaches zero', () => {
    const now = Date.now();
    const expiresAt = now + 1000; // 1 second from now
    const onExpired = vi.fn();

    vi.setSystemTime(now);
    renderHook(() =>
      useOpponentDisconnectCountdown({ graceDurationMs: 1000, expiresAt }, onExpired),
    );

    // Advance past expiry
    vi.advanceTimersByTime(1100);
    vi.setSystemTime(now + 1100);

    expect(onExpired).toHaveBeenCalled();
  });

  it('does not allow countdown to go negative', () => {
    const now = Date.now();
    const expiresAt = now - 1000; // Already expired

    vi.setSystemTime(now);
    const { result } = renderHook(() => useOpponentDisconnectCountdown({ graceDurationMs: 1000, expiresAt }));

    expect(result.current).toBe(0);
  });
});
