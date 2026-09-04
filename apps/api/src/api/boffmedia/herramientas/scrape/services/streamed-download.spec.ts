/**
 * The idle watchdog and the partial-file discipline, which are the two things
 * here that fail SILENTLY when they regress: a broken timeout looks exactly
 * like a slow mirror, and a leaked `.part` looks exactly like a finished ROM.
 *
 * Real timers with a short idle budget rather than jest fake timers, on
 * purpose: the code under test interleaves timers with real filesystem I/O, and
 * faking one half of that pair is how you get a test that hangs instead of one
 * that fails.
 */

import { existsSync } from 'fs';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { Readable } from 'stream';

import { downloadToFile } from './streamed-download';

/** A source we drive by hand: nothing arrives until the test pushes it. */
function manualSource(): Readable {
  return new Readable({ read() {} });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('downloadToFile', () => {
  let dir: string;
  let target: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'myrient-dl-'));
    target = path.join(dir, 'game.zip');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes the file and leaves no .part behind on success', async () => {
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 500,
      open: async () => source,
    });

    source.push(Buffer.from('ROM'));
    source.push(Buffer.from('DATA'));
    source.push(null);

    await expect(promise).resolves.toEqual({
      outcome: 'downloaded',
      receivedBytes: 7,
    });
    await expect(readFile(target, 'utf8')).resolves.toBe('ROMDATA');
    expect(existsSync(`${target}.part`)).toBe(false);
  });

  it('gives up when the connection stops sending bytes', async () => {
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 80,
      open: async () => source,
    });

    source.push(Buffer.from('half'));
    // …and then silence. This is the case the audit reported: the socket is
    // open, so nothing errors, and the old code waited forever.

    const result = await promise;
    expect(result.outcome).toBe('stalled');
    expect(result.receivedBytes).toBe(4);
  });

  it('gives up when the connection never sends anything at all', async () => {
    const source = manualSource();
    const result = await downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 80,
      open: async () => source,
    });

    expect(result.outcome).toBe('stalled');
    expect(result.receivedBytes).toBe(0);
  });

  /**
   * The whole reason the budget is idle-based. A legitimate ROM download is
   * slow; only a dead one is quiet. A total-elapsed timeout would fail this.
   */
  it('does not give up on a slow but living transfer', async () => {
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 120,
      open: async () => source,
    });

    // Six chunks over ~360ms — three times the idle budget in total elapsed
    // time, but never more than 60ms of silence.
    for (let i = 0; i < 6; i++) {
      await wait(60);
      source.push(Buffer.from('x'));
    }
    source.push(null);

    await expect(promise).resolves.toEqual({
      outcome: 'downloaded',
      receivedBytes: 6,
    });
  });

  it('deletes the partial file when it stalls, so a later run retries it', async () => {
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 80,
      open: async () => source,
    });
    source.push(Buffer.from('truncated'));

    await promise;

    // Both must be gone. A leftover at `target` is the worst outcome of all:
    // every caller skips a file that already exists, so a truncated ROM would
    // be permanently mistaken for a complete one.
    expect(existsSync(target)).toBe(false);
    expect(existsSync(`${target}.part`)).toBe(false);
  });

  it('reports a cancel as cancelled, not as a failure, and cleans up', async () => {
    const controller = new AbortController();
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 5_000,
      signal: controller.signal,
      open: async () => source,
    });

    source.push(Buffer.from('partial'));
    await wait(20);
    controller.abort();

    const result = await promise;
    expect(result.outcome).toBe('cancelled');
    expect(existsSync(target)).toBe(false);
    expect(existsSync(`${target}.part`)).toBe(false);
  });

  it('aborts the underlying request rather than only abandoning the local write', async () => {
    const controller = new AbortController();
    const source = manualSource();
    let openedWith: AbortSignal | null = null;

    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 5_000,
      signal: controller.signal,
      open: async (_url, streamSignal) => {
        openedWith = streamSignal;
        return source;
      },
    });

    source.push(Buffer.from('bytes'));
    await wait(20);
    controller.abort();
    await promise;

    // The opener's signal is what carries the cancel down to the HTTP request;
    // if it never fires, the socket keeps pulling gigabytes for nobody.
    expect(openedWith).not.toBeNull();
    expect((openedWith as unknown as AbortSignal).aborted).toBe(true);
    // `pipeline` destroys the source too, so the far end is actually released.
    expect(source.destroyed).toBe(true);
  });

  it('does not open a request at all when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const open = jest.fn();

    const result = await downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      signal: controller.signal,
      open,
    });

    expect(result).toEqual({ outcome: 'cancelled', receivedBytes: 0 });
    expect(open).not.toHaveBeenCalled();
  });

  it('reports a transport error as failed and leaves nothing behind', async () => {
    const result = await downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      open: async () => {
        throw new Error('getaddrinfo ENOTFOUND');
      },
    });

    expect(result.outcome).toBe('failed');
    expect(result.error).toContain('ENOTFOUND');
    expect(existsSync(`${target}.part`)).toBe(false);
  });

  it('discards a stale .part from a killed run instead of appending to it', async () => {
    await writeFile(`${target}.part`, 'GARBAGE-FROM-A-CRASH');

    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 500,
      open: async () => source,
    });
    source.push(Buffer.from('FRESH'));
    source.push(null);

    await promise;
    // Resuming is not supported, so the only correct thing to do with the old
    // bytes is throw them away — appending would produce a corrupt file that
    // passes every existence check.
    await expect(readFile(target, 'utf8')).resolves.toBe('FRESH');
  });

  it('reports running byte counts so a caller can show a stall before the timeout', async () => {
    const seen: number[] = [];
    const source = manualSource();
    const promise = downloadToFile({
      url: 'https://myrient.erista.me/game.zip',
      filePath: target,
      idleTimeoutMs: 500,
      onProgress: (bytes) => seen.push(bytes),
      open: async () => source,
    });

    source.push(Buffer.from('aa'));
    source.push(Buffer.from('bbb'));
    source.push(null);
    await promise;

    // Cumulative, not per-chunk: the caller wants "how far did it get".
    expect(seen).toEqual([2, 5]);
  });
});
