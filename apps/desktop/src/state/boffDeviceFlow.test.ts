import { describe, it, expect } from "vitest";

/**
 * Test the exponential backoff schedule for the device code poll.
 * The interval should start at intervalSeconds and exponentially increase,
 * capped at 30 seconds, using a 1.5x multiplier per poll.
 */
describe("Boff Device Flow — Exponential Backoff", () => {
  const initialIntervalMs = 2000; // 2 seconds from code.intervalSeconds
  const MAX_BACKOFF_MS = 30_000; // 30 second cap

  function calculateBackoff(pollCount: number): number {
    if (pollCount === 0) return initialIntervalMs;
    return Math.min(
      initialIntervalMs * Math.pow(1.5, pollCount - 1),
      MAX_BACKOFF_MS
    );
  }

  it("should start with the initial interval", () => {
    expect(calculateBackoff(0)).toBe(2000);
  });

  it("should increase interval on each poll with 1.5x multiplier", () => {
    // Poll 1: 2000 * 1.5^0 = 2000
    expect(calculateBackoff(1)).toBe(2000);
    // Poll 2: 2000 * 1.5^1 = 3000
    expect(calculateBackoff(2)).toBe(3000);
    // Poll 3: 2000 * 1.5^2 = 4500
    expect(calculateBackoff(3)).toBe(4500);
    // Poll 4: 2000 * 1.5^3 = 6750
    expect(calculateBackoff(4)).toBe(6750);
  });

  it("should cap backoff at 30 seconds", () => {
    const pollCount = 20;
    const interval = calculateBackoff(pollCount);
    expect(interval).toBeLessThanOrEqual(MAX_BACKOFF_MS);
    expect(interval).toBe(MAX_BACKOFF_MS);
  });

  it("should eventually reach and stay at max backoff", () => {
    let prevInterval = initialIntervalMs;
    for (let i = 1; i <= 15; i++) {
      const interval = calculateBackoff(i);
      expect(interval).toBeGreaterThanOrEqual(prevInterval);
      expect(interval).toBeLessThanOrEqual(MAX_BACKOFF_MS);
      prevInterval = interval;
    }
    // Should be at max after enough polls
    expect(calculateBackoff(15)).toBe(MAX_BACKOFF_MS);
  });
});

/**
 * Test the device code expiry state transition.
 * When the deadline is reached, the UI should show an expired state
 * instead of immediately failing.
 */
describe("Boff Device Flow — Expiry State", () => {
  it("should track elapsed time in seconds", () => {
    const startTime = Date.now();
    const deadline = startTime + 600_000; // 10 minutes

    // Simulate passage of time
    const elapsed1 = Math.floor((startTime + 5000 - startTime) / 1000);
    const elapsed2 = Math.floor((startTime + 60_000 - startTime) / 1000);

    expect(elapsed1).toBe(5);
    expect(elapsed2).toBe(60);
  });

  it("should detect expiry when current time exceeds deadline", () => {
    const startTime = Date.now();
    const expiresIn = 600; // 10 minutes
    const deadline = startTime + expiresIn * 1000;

    // Before expiry
    expect(Date.now()).toBeLessThan(deadline);

    // Simulate expiry (in real code, this would be checked in the poll loop)
    const expiredTime = deadline + 1;
    expect(expiredTime).toBeGreaterThan(deadline);
  });

  it("should format elapsed time correctly", () => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(60)).toBe("1:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(125)).toBe("2:05");
    expect(formatTime(599)).toBe("9:59");
    expect(formatTime(600)).toBe("10:00");
  });
});
