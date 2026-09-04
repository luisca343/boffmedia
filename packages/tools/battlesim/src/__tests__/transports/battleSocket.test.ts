/**
 * Opening a battle socket — the half of "hung on connecting" that is the
 * client's fault.
 *
 * Three things were wrong here and all three produced the same symptom, which
 * is why they are checked together: a connection that could not be made simply
 * never reported anything.
 *
 *  - `transports: ["websocket", "polling"]` bought NO fallback, because
 *    Engine.IO defaults `tryAllTransports` to false. A refused upgrade failed
 *    the connection outright and the reconnection loop then retried websocket
 *    forever on a network where it could never work.
 *  - the ticket was refreshed from `reconnect_attempt` with a floating promise,
 *    which fires alongside the attempt rather than before it — so every retry
 *    went out carrying the ticket that had just been refused.
 *  - `fetchBattleTicket` had no deadline, so a request that never settled left
 *    `openBattleSocket` pending for the life of the page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const io = vi.fn();
const request = vi.fn();

vi.mock('socket.io-client', () => ({ io: (...args: unknown[]) => io(...args) }));
vi.mock('@boffmedia/tool-kit', () => ({
  toolApi: () => ({ request }),
  getToolHost: () => ({ apiUrl: () => 'https://api.example.test/' }),
}));

const { fetchBattleTicket, openBattleSocket } = await import('../../engine/battleSocket');

/** The `auth` callback socket.io was handed, and the url it was handed with. */
function lastIoCall() {
  const [url, opts] = io.mock.calls.at(-1) as [string, Record<string, any>];
  return { url, opts };
}

beforeEach(() => {
  io.mockReset();
  request.mockReset();
  io.mockReturnValue({ on: vi.fn(), io: { on: vi.fn() } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('openBattleSocket', () => {
  it('addresses the namespace without the joiner’s trailing slash', async () => {
    request.mockResolvedValue({ data: { ticket: 't0' } });
    await openBattleSocket('/battle');
    expect(lastIoCall().url).toBe('https://api.example.test/battle');
  });

  it('asks Engine.IO to actually try the fallback transport', async () => {
    request.mockResolvedValue({ data: { ticket: 't0' } });
    await openBattleSocket('/battle');
    const { opts } = lastIoCall();
    // Listing polling second is only a fallback if this is on. Without it the
    // second entry is decoration and a blocked upgrade is a permanent failure.
    expect(opts.transports).toEqual(['websocket', 'polling']);
    expect(opts.tryAllTransports).toBe(true);
  });

  it('mints a fresh ticket for every attempt after the first', async () => {
    request.mockResolvedValueOnce({ data: { ticket: 'first' } });
    await openBattleSocket('/battle');
    const { opts } = lastIoCall();
    expect(typeof opts.auth).toBe('function');

    // The initial attempt spends the ticket the open already paid for — one
    // request, not two.
    const first = await new Promise<any>((resolve) => opts.auth(resolve));
    expect(first).toEqual({ ticket: 'first' });
    expect(request).toHaveBeenCalledTimes(1);

    // A reconnect is a new attempt and a 60-second ticket is long gone.
    request.mockResolvedValueOnce({ data: { ticket: 'second' } });
    const second = await new Promise<any>((resolve) => opts.auth(resolve));
    expect(second).toEqual({ ticket: 'second' });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('still calls back when the refresh fails, rather than leaving the attempt pending', async () => {
    request.mockResolvedValueOnce({ data: { ticket: 'first' } });
    await openBattleSocket('/battle');
    const { opts } = lastIoCall();
    await new Promise<any>((resolve) => opts.auth(resolve));

    request.mockRejectedValueOnce(new Error('offline'));
    // An empty ticket is refused immediately and the next attempt is scheduled.
    // Never calling back would hang the attempt forever, which is the failure
    // mode this whole file exists to avoid.
    await expect(new Promise<any>((resolve) => opts.auth(resolve))).resolves.toEqual({ ticket: '' });
  });
});

describe('fetchBattleTicket', () => {
  it('gives up on a request that never settles', async () => {
    vi.useFakeTimers();
    request.mockImplementation(({ signal }: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    );

    const pending = fetchBattleTicket();
    const settled = expect(pending).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(10_000);
    await settled;
  });

  it('accepts the enveloped body and the bare one', async () => {
    request.mockResolvedValueOnce({ data: { ticket: 'enveloped' } });
    await expect(fetchBattleTicket()).resolves.toBe('enveloped');
    request.mockResolvedValueOnce({ ticket: 'bare' });
    await expect(fetchBattleTicket()).resolves.toBe('bare');
    request.mockResolvedValueOnce({});
    await expect(fetchBattleTicket()).rejects.toThrow(/no battle ticket/i);
  });
});
