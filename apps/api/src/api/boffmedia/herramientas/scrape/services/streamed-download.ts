/**
 * One file, fetched over HTTP and written to disk, with the three things a
 * multi-GiB download needs and a plain `pipeline(response.data, writeStream)`
 * does not have: an IDLE timeout, a CANCEL, and a partial file that never
 * survives a failure.
 *
 * Why idle and not total: a legitimate ROM download is slow — hours, on a
 * throttled mirror — so any total-elapsed cap is either useless or wrong. A
 * DEAD download is not slow, it is SILENT, so the signal to watch is the time
 * since the last byte. (Same trap as the Rust asset client: reqwest's
 * `.timeout()` covers the whole body and had to be swapped for a read timeout.)
 *
 * Why a `.part` file: the callers all skip a game whose target path already
 * exists. Leaving a truncated file at the target path after a stall therefore
 * does not merely waste disk — it makes that game PERMANENTLY unfetchable,
 * because every later run skips it as "already downloaded". The bytes land in
 * `<target>.part` and are renamed into place only after the stream ends
 * cleanly; every failure path unlinks them.
 */

import axios from 'axios';
import { createWriteStream } from 'fs';
import { rename, unlink } from 'fs/promises';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * How a single download ended.
 *
 * `stalled`, `cancelled` and `failed` are deliberately three values and not
 * one: they need three different words in the UI and imply three different
 * user actions (retry later / nothing, you did this / look at the error).
 */
export type StreamedDownloadOutcome =
  | 'downloaded'
  | 'stalled'
  | 'cancelled'
  | 'failed';

export interface StreamedDownloadResult {
  outcome: StreamedDownloadOutcome;
  /** Bytes written. Present even when the outcome is not `downloaded` — it is
   *  how far a stalled or cancelled transfer got. */
  receivedBytes: number;
  /** Machine text for logs. Never rendered verbatim to users. */
  error?: string;
}

/**
 * No bytes for this long and the transfer is declared dead.
 *
 * 90s rather than something tighter because Myrient throttles hard under load
 * and a queued request can sit quiet for a minute before the body starts; the
 * point is to catch a connection that will NEVER speak again, not to police
 * slowness.
 */
export const DEFAULT_IDLE_TIMEOUT_MS = 90_000;

/** Raised by the watchdog. Not exported: callers read `outcome` instead. */
class IdleTimeoutError extends Error {
  readonly idle = true;
  constructor(ms: number) {
    super(`No data received for ${ms}ms`);
    this.name = 'IdleTimeoutError';
  }
}

/** The stream opener, injectable so the timing logic can be tested without a
 *  socket. Production passes {@link openHttpStream}. */
export type StreamOpener = (
  url: string,
  signal: AbortSignal,
) => Promise<NodeJS.ReadableStream>;

const USER_AGENT = 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)';

/** The real opener: an axios GET in stream mode, wired to the same signal so a
 *  cancel lands even while we are still waiting for response headers. */
export const openHttpStream: StreamOpener = async (url, signal) => {
  const response = await axios.get<NodeJS.ReadableStream>(url, {
    responseType: 'stream',
    headers: { 'User-Agent': USER_AGENT },
    // No axios timeout: axios' `timeout` is a RESPONSE timeout, which for a
    // stream means "time to headers" and does nothing once bytes start. The
    // idle watchdog below is what actually guards the body.
    timeout: 0,
    signal,
  });
  return response.data;
};

export interface StreamedDownloadOptions {
  url: string;
  /** Final path. Bytes go to `${filePath}.part` until the stream ends cleanly. */
  filePath: string;
  /** Cancellation from the caller — a disconnected SSE client, in practice. */
  signal?: AbortSignal;
  idleTimeoutMs?: number;
  /** Called on every chunk with the running byte count, so a caller can report
   *  live progress (and, more usefully, report that it has STOPPED moving). */
  onProgress?: (receivedBytes: number) => void;
  /** Test seam. Defaults to {@link openHttpStream}. */
  open?: StreamOpener;
}

/**
 * Builds the watchdog: a pass-through that arms a timer on construction and
 * re-arms it on every chunk, destroying the pipeline if the timer ever fires.
 *
 * A pass-through and not a `source.on('data')` listener, because attaching a
 * `data` handler switches the source into flowing mode behind `pipeline`'s
 * back and starts dropping chunks on the floor.
 */
function idleWatchdog(
  idleMs: number,
  onChunk: (bytes: number) => void,
): Transform {
  let timer: NodeJS.Timeout | null = null;
  let received = 0;

  const transform = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      received += chunk.length;
      onChunk(received);
      arm();
      cb(null, chunk);
    },
    flush(cb) {
      disarm();
      cb();
    },
  });

  function arm() {
    disarm();
    timer = setTimeout(() => {
      transform.destroy(new IdleTimeoutError(idleMs));
    }, idleMs);
    // An armed watchdog must not be the reason the process cannot exit.
    timer.unref?.();
  }
  function disarm() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  // Armed before the first byte too: a connection that opens and then says
  // nothing is exactly the case the audit reported.
  arm();
  transform.on('close', disarm);
  return transform;
}

/** Best-effort removal. A missing file is the desired end state, so ENOENT is
 *  success, not an error worth surfacing. */
async function discard(partPath: string): Promise<void> {
  try {
    await unlink(partPath);
  } catch {
    /* already gone */
  }
}

/**
 * Fetch `url` into `filePath`, never leaving a partial file behind.
 *
 * Never throws for a transport failure — the callers download many files and
 * one dead mirror must not abort the batch, so every ending comes back as an
 * {@link StreamedDownloadResult} instead.
 */
export async function downloadToFile(
  options: StreamedDownloadOptions,
): Promise<StreamedDownloadResult> {
  const {
    url,
    filePath,
    signal,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    onProgress,
    open = openHttpStream,
  } = options;

  const partPath = `${filePath}.part`;
  let received = 0;

  // A leftover `.part` from a killed process is stale by definition — we do not
  // resume, so appending to it would produce a corrupt file.
  await discard(partPath);

  if (signal?.aborted) return { outcome: 'cancelled', receivedBytes: 0 };

  // Our own controller so the watchdog can also tear down the HTTP request,
  // not just the local pipeline. Linked to the caller's signal, if any.
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const source = await open(url, controller.signal);
    const watchdog = idleWatchdog(idleTimeoutMs, (bytes) => {
      received = bytes;
      onProgress?.(bytes);
    });
    const sink = createWriteStream(partPath);

    try {
      await pipeline(source, watchdog, sink, { signal: controller.signal });
    } catch (err) {
      // `pipeline` has already destroyed all three streams; the only thing left
      // to undo is the half-written file.
      await discard(partPath);
      return classify(err, received, signal);
    }

    // Only now is the file whole. `rename` inside one filesystem is atomic, so
    // no reader can ever observe a truncated target path.
    await rename(partPath, filePath);
    return { outcome: 'downloaded', receivedBytes: received };
  } catch (err) {
    // Failure before the pipeline existed — DNS, a 404, or a cancel during the
    // request. `.part` may not exist; `discard` copes.
    await discard(partPath);
    return classify(err, received, signal);
  } finally {
    signal?.removeEventListener('abort', forwardAbort);
  }
}

/**
 * Turns a thrown value into one of the three failure outcomes.
 *
 * The order matters. A cancel and a stall BOTH surface as an AbortError,
 * because both work by aborting the same controller — so the caller's signal is
 * checked first, and only an abort we did not ask for is read as a stall.
 */
function classify(
  err: unknown,
  receivedBytes: number,
  callerSignal?: AbortSignal,
): StreamedDownloadResult {
  if (callerSignal?.aborted) return { outcome: 'cancelled', receivedBytes };

  if (err instanceof IdleTimeoutError) {
    return { outcome: 'stalled', receivedBytes, error: err.message };
  }
  // The watchdog destroys the transform, so `pipeline` can reject with the
  // AbortError from the linked controller rather than with our own error.
  const name = err instanceof Error ? err.name : '';
  const cause = (err as { cause?: unknown } | null)?.cause;
  if (cause instanceof IdleTimeoutError) {
    return { outcome: 'stalled', receivedBytes, error: cause.message };
  }
  if (name === 'AbortError' || name === 'CanceledError') {
    return { outcome: 'stalled', receivedBytes, error: 'Aborted with no data' };
  }

  return {
    outcome: 'failed',
    receivedBytes,
    error: err instanceof Error ? err.message : String(err),
  };
}
