import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { access, mkdir, readdir, stat } from 'fs/promises';
import * as path from 'path';
import { laboonPath } from '@/config/paths';
import { safeFetch, safeFetchStream } from '@api/_utils/http/safe-fetch';
import {
  DEFAULT_IDLE_TIMEOUT_MS,
  downloadToFile,
  type StreamedDownloadOutcome,
} from './streamed-download';
import { GameFileEntry } from '../entities/game-file.entity';
import { EuropeAggregateResult } from '../entities/europe-aggregate.entity';
import { DownloadResult } from '../entities/download-result.entity';
import {
  BulkDownloadResult,
  FileDownloadEntry,
  FileDownloadStatus,
} from '../entities/bulk-download-result.entity';
import {
  LocalGameEntry,
  LocalGamesResult,
  SearchConsoleResult,
  SearchLocalGamesResult,
  CatalogSearchConsoleResult,
  CatalogSearchResult,
} from '../entities/local-games.entity';
import { DownloadAllGamesDto } from '../dto/download-all-games.dto';
import { DownloadSelectedGamesDto } from '../dto/download-selected-games.dto';
import { MyrientConsole } from '../enums/myrient-console.enum';
import { CONSOLE_CATALOG } from '../constants/myrient-catalog.constants';

// ---------------------------------------------------------------------------
// Size helpers
// ---------------------------------------------------------------------------

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1_000,
  mb: 1_000_000,
  gb: 1_000_000_000,
  tb: 1_000_000_000_000,
  kib: 1_024,
  mib: 1_048_576,
  gib: 1_073_741_824,
  tib: 1_099_511_627_776,
};

/** Parses a human-readable size string (e.g. "1.2 GiB") into bytes. Returns 0 on parse failure. */
function parseSizeToBytes(size: string): number {
  const match = size.trim().match(/^([\d.,]+)\s*([A-Za-z]+)$/);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  const multiplier = SIZE_UNITS[unit] ?? 0;
  return Math.round(value * multiplier);
}

/** Formats a byte count into the most appropriate human-readable unit (binary prefixes). */
function formatBytes(bytes: number): string {
  if (bytes >= SIZE_UNITS.tib)
    return `${(bytes / SIZE_UNITS.tib).toFixed(2)} TiB`;
  if (bytes >= SIZE_UNITS.gib)
    return `${(bytes / SIZE_UNITS.gib).toFixed(2)} GiB`;
  if (bytes >= SIZE_UNITS.mib)
    return `${(bytes / SIZE_UNITS.mib).toFixed(2)} MiB`;
  if (bytes >= SIZE_UNITS.kib)
    return `${(bytes / SIZE_UNITS.kib).toFixed(2)} KiB`;
  return `${bytes} B`;
}

/** Returns true when a filename matches at least one of the provided region strings. */
function matchesRegions(name: string, regions: string[]): boolean {
  if (!regions.length) return true;
  return regions.some((region) =>
    new RegExp(`\\b${region}\\b`, 'i').test(name),
  );
}

/** Checks whether a file already exists on disk. */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** How often the SSE stream reports that an in-flight transfer is (or is not)
 *  still receiving bytes. Short enough that a stall is visible long before the
 *  90s watchdog fires, long enough not to be its own traffic. */
const TICK_INTERVAL_MS = 3_000;

/**
 * A frame buffer between the download job and the SSE generator.
 *
 * The generator used to BE the job, which meant it could not emit anything
 * while awaiting a batch — and a batch is where all the time goes. Splitting
 * them lets the job push heartbeats from inside a transfer while the generator
 * does nothing but drain.
 */
class FrameQueue {
  private readonly items: string[] = [];
  private waiter: (() => void) | null = null;
  private closed = false;

  push(frame: Record<string, unknown>): void {
    if (this.closed) return;
    this.items.push(`data: ${JSON.stringify(frame)}

`);
    this.wake();
  }

  close(): void {
    this.closed = true;
    this.wake();
  }

  private wake(): void {
    const waiter = this.waiter;
    this.waiter = null;
    waiter?.();
  }

  async *drain(): AsyncGenerator<string> {
    for (;;) {
      // Drain everything buffered before sleeping: a `close()` that lands with
      // frames still queued must not lose them.
      while (this.items.length) yield this.items.shift() as string;
      if (this.closed) return;
      await new Promise<void>((resolve) => {
        this.waiter = resolve;
      });
    }
  }
}

/**
 * Counts one batch's outcomes.
 *
 * Shared rather than inlined twice because the two bulk routes drifting on how
 * they count is exactly the class of bug that makes a summary lie.
 */
function tally(results: FileDownloadEntry[]) {
  const count = (status: FileDownloadStatus) =>
    results.filter((r) => r.status === status).length;
  return {
    downloaded: count('downloaded'),
    skipped: count('skipped'),
    failed: count('failed'),
    stalled: count('stalled'),
    cancelled: count('cancelled'),
    // Skipped files count toward the on-disk total: they ARE on disk. A stalled
    // or cancelled one contributes nothing — its partial bytes were deleted.
    totalDownloadedSizeBytes: results
      .filter((r) => r.status === 'downloaded' || r.status === 'skipped')
      .reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0),
  };
}

/**
 * Runs an array of async tasks with a maximum number of concurrent executions.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

@Injectable()
export class MyrientScrapeService {
  private readonly logger = new Logger(MyrientScrapeService.name);

  /**
   * Returns the files already downloaded locally for a given console,
   * with optional region filtering against the filename.
   */
  /**
   * Resolves and validates the path for a locally-stored game file so the
   * controller can stream it to the browser. Uses path.basename() to prevent
   * path-traversal attacks.
   */
  async resolveLocalFile(
    consoleKey: MyrientConsole,
    filename: string,
  ): Promise<{ filePath: string; safeName: string }> {
    const catalog = CONSOLE_CATALOG[consoleKey];
    const safeName = path.basename(filename);
    const filePath = laboonPath(
      'juegos',
      'Roms',
      catalog.localFolder,
      safeName,
    );
    await access(filePath); // throws ENOENT if missing
    return { filePath, safeName };
  }

  async getLocalGames(
    consoleKey: MyrientConsole,
    regions: string[],
  ): Promise<LocalGamesResult> {
    const catalog = CONSOLE_CATALOG[consoleKey];
    const saveDir = laboonPath('juegos', 'Roms', catalog.localFolder);

    let entries: LocalGameEntry[] = [];
    try {
      const filenames = await readdir(saveDir);
      const stats = await Promise.all(
        filenames.map(async (filename): Promise<LocalGameEntry | null> => {
          try {
            const filePath = path.join(saveDir, filename);
            const { size: sizeBytes, isFile } = await stat(filePath).then(
              (s) => ({ size: s.size, isFile: s.isFile() }),
            );
            if (!isFile) return null;
            return { filename, size: formatBytes(sizeBytes), sizeBytes };
          } catch {
            return null;
          }
        }),
      );
      entries = stats.filter((e): e is LocalGameEntry => e !== null);
    } catch {
      // Directory doesn't exist yet — return empty
    }

    if (regions.length) {
      entries = entries.filter((e) => matchesRegions(e.filename, regions));
    }

    const totalSizeBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    return {
      console: consoleKey,
      consoleLabel: catalog.label,
      count: entries.length,
      totalSize: formatBytes(totalSizeBytes),
      totalSizeBytes,
      files: entries,
    };
  }

  /**
   * Searches for games matching the given query across all locally-stored
   * consoles in parallel. Returns results grouped by console, excluding
   * consoles with no matches.
   */
  async searchLocalGames(
    query: string,
    regions: string[],
  ): Promise<SearchLocalGamesResult> {
    const q = query.trim().toLowerCase();
    const consoleKeys = Object.keys(CONSOLE_CATALOG) as MyrientConsole[];

    const groups = await Promise.all(
      consoleKeys.map(async (key): Promise<SearchConsoleResult | null> => {
        const result = await this.getLocalGames(key, regions);
        const files = q
          ? result.files.filter((f) => f.filename.toLowerCase().includes(q))
          : result.files;
        if (!files.length) return null;
        return {
          consoleKey: key,
          consoleLabel: result.consoleLabel,
          count: files.length,
          files,
        };
      }),
    );

    const consoles = groups.filter((g): g is SearchConsoleResult => g !== null);
    const totalCount = consoles.reduce((sum, c) => sum + c.count, 0);
    return { query, totalCount, consoles };
  }

  /**
   * Searches remote Myrient catalogs for games matching the query across all
   * consoles, running scrapes with bounded concurrency to avoid hammering the
   * server. Consoles whose scrape fails are silently skipped.
   */
  async searchCatalog(
    query: string,
    regions: string[],
  ): Promise<CatalogSearchResult> {
    const q = query.trim().toLowerCase();
    const consoleKeys = Object.keys(CONSOLE_CATALOG) as MyrientConsole[];

    const groups = await runWithConcurrency(
      consoleKeys.map(
        (key) => async (): Promise<CatalogSearchConsoleResult | null> => {
          try {
            const result = await this.scrapeCatalog(key, regions);
            const files = q
              ? result.files.filter((f) => f.name.toLowerCase().includes(q))
              : result.files;
            if (!files.length) return null;
            return {
              consoleKey: key,
              consoleLabel: CONSOLE_CATALOG[key].label,
              count: files.length,
              files,
            };
          } catch {
            return null;
          }
        },
      ),
      5,
    );

    const consoles = groups.filter(
      (g): g is CatalogSearchConsoleResult => g !== null,
    );
    return {
      query,
      totalCount: consoles.reduce((s, c) => s + c.count, 0),
      consoles,
    };
  }

  /**
   * Scrapes a console's catalog and returns the entries filtered by the
   * provided region strings, together with the aggregated total size.
   * Pass an empty regions array to get everything.
   */
  async scrapeCatalog(
    consoleKey: MyrientConsole,
    regions: string[],
  ): Promise<EuropeAggregateResult> {
    const catalog = CONSOLE_CATALOG[consoleKey];
    const all = await this.scrapeDirectoryListing(catalog.url);
    const filtered = regions.length
      ? all.filter((entry) => matchesRegions(entry.name, regions))
      : all;

    const totalSizeBytes = filtered.reduce(
      (sum, entry) => sum + parseSizeToBytes(entry.size),
      0,
    );

    return {
      count: filtered.length,
      totalSizeBytes,
      totalSize: formatBytes(totalSizeBytes),
      files: filtered,
    };
  }

  /**
   * Generic scraper for any Myrient h5ai directory listing URL.
   * Works for any catalog page that follows the same HTML structure.
   *
   * SSRF protection: URLs must be from myrient.erista.me (the Myrient service domain).
   */
  async scrapeDirectoryListing(url: string): Promise<GameFileEntry[]> {
    // Fetch using safe-fetch to enforce SSRF protection: HTTPS-only, host allowlist,
    // and IP range validation. The response is buffered, so maxBytes serves as a
    // reasonable upper bound for HTML catalog pages.
    const html = await safeFetch(url, {
      allowedHosts: ['myrient.erista.me'],
      timeout: 30_000,
      maxBytes: 50_000_000, // 50 MB limit for HTML catalog
      axiosConfig: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      },
    });

    const $ = cheerio.load(html);
    const entries: GameFileEntry[] = [];

    // Myrient uses h5ai – each file row is a <tr class="file"> inside <tbody id="fallback-tbody">
    // Fallback: iterate over all <tr> elements that contain a download link.
    $('tr').each((_i, row) => {
      const $row = $(row);

      // The file link lives in an <a> whose href points directly to a file (not a directory).
      const $anchor = $row
        .find('a[href]')
        .filter((_j, el) => {
          const href = $(el).attr('href') ?? '';
          // Exclude parent-directory links and directory entries (trailing slash).
          return !href.endsWith('/') && href !== '../' && href !== './';
        })
        .first();

      if (!$anchor.length) return;

      const rawHref = $anchor.attr('href');
      if (!rawHref) return;

      // Resolve relative hrefs against the directory URL being scraped so we get
      // the full path (e.g. /files/No-Intro/Nintendo - Game Boy/game.zip) instead
      // of just the domain root.
      const link = new URL(rawHref, url).href;

      // Game name: prefer the <a> text, fall back to decoding the href filename.
      const anchorText = $anchor.text().trim();
      const name =
        anchorText || decodeURIComponent(rawHref.split('/').pop() ?? rawHref);

      // File size: h5ai renders it in a <td> with class "size", or as the last meaningful <td>.
      let size = '';
      const $sizeCell = $row.find('td.size, td[data-size]').first();
      if ($sizeCell.length) {
        size = $sizeCell.text().trim();
      } else {
        // Generic fallback: grab all <td> texts and take the one that looks like a size.
        $row.find('td').each((_j, td) => {
          const text = $(td).text().trim();
          if (/^\d[\d.,]* ?(B|KiB|MiB|GiB|TiB|KB|MB|GB|TB)$/i.test(text)) {
            size = text;
          }
        });
      }

      entries.push({ name, link, size });
    });

    return entries;
  }

  /**
   * Downloads a game file from a Myrient URL to the local 3DS games directory.
   * Uses HTTP streaming so even multi-GiB files are written in chunks without
   * loading the entire file into memory.
   *
   * SSRF protection: URLs must be from myrient.erista.me (the Myrient service domain).
   * This is an admin-only route, so the caller has already been authenticated.
   *
   * @param url  Full URL to the zip/cia/3ds file to download (must be from Myrient).
   * @returns    Metadata about the saved file.
   */
  async downloadGame(url: string, signal?: AbortSignal): Promise<DownloadResult> {
    const townPath = laboonPath('juegos', 'myrient', '3DS');
    await mkdir(townPath, { recursive: true });

    // Derive a safe filename from the URL.
    const filename = decodeURIComponent(url.split('/').pop() ?? 'unknown');
    const filePath = path.join(townPath, filename);

    // Fetch using safe-fetch to enforce SSRF protection: HTTPS-only, host allowlist,
    // and IP range validation. `timeout: 0` there is NOT "no timeout": axios'
    // timeout is a time-to-HEADERS budget and does nothing once a multi-GiB body
    // starts flowing. The guard that matters is the IDLE timeout inside
    // `downloadToFile`, which also keeps a dead transfer from leaving a
    // truncated file behind under the final name.
    const result = await downloadToFile({
      url,
      filePath,
      signal,
      open: async (target, streamSignal) => {
        const response = await safeFetchStream(target, {
          allowedHosts: ['myrient.erista.me'],
          timeout: 0, // no header timeout – a busy mirror can be slow to start
          maxBytes: 50_000_000_000, // 50 GB limit for game files
          axiosConfig: {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)',
            },
            signal: streamSignal,
          },
        });
        return response.data;
      },
    });

    if (result.outcome !== 'downloaded') {
      // This single-file route answers with a DownloadResult that has no status
      // field, so the only way to tell the three failures apart downstream is to
      // throw — with the outcome word in the message, deliberately.
      throw new Error(
        `Download ${result.outcome}: ${result.error ?? filename} ` +
          `(${formatBytes(result.receivedBytes)} received)`,
      );
    }

    const { size: sizeBytes } = await stat(filePath);

    return {
      success: true,
      filename,
      path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      sizeBytes,
      size: formatBytes(sizeBytes),
    };
  }

  /**
   * The one place a catalogue entry becomes a file on disk.
   *
   * All three bulk paths (blocking-all, blocking-selected, SSE-selected) funnel
   * through here so the idle timeout, the cancel and the partial-file cleanup
   * cannot drift apart between them — three copy-pasted `axios.get` + `pipeline`
   * blocks is how all three came to have no timeout at all.
   */
  private async fetchOne(
    entry: GameFileEntry,
    saveDir: string,
    prefix: string,
    options: {
      signal?: AbortSignal;
      onProgress?: (receivedBytes: number) => void;
    } = {},
  ): Promise<FileDownloadEntry> {
    const filename = decodeURIComponent(
      entry.link.split('/').pop() ?? entry.name,
    );
    const filePath = path.join(saveDir, filename);

    // Trusting "it is on disk, therefore it is complete" is only safe now that a
    // failed transfer can no longer leave a truncated file under the final name.
    // Before `.part`, a stall wrote a broken ROM that every later run skipped.
    if (await fileExists(filePath)) {
      const { size: sizeBytes } = await stat(filePath);
      this.logger.log(`${prefix} SKIP (already exists) ${filename}`);
      return {
        filename,
        status: 'skipped',
        size: formatBytes(sizeBytes),
        sizeBytes,
      };
    }

    // A file the batch never reached because the caller gave up is `cancelled`,
    // not `failed`: nothing went wrong with it.
    if (options.signal?.aborted) return { filename, status: 'cancelled' };

    this.logger.log(
      `${prefix} Downloading ${filename} (${entry.size || 'unknown size'}) — ${entry.link}`,
    );

    const result = await downloadToFile({
      url: entry.link,
      filePath,
      signal: options.signal,
      idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
      onProgress: options.onProgress,
    });

    if (result.outcome === 'downloaded') {
      const { size: sizeBytes } = await stat(filePath);
      this.logger.log(`${prefix} OK ${filename} → ${formatBytes(sizeBytes)}`);
      return {
        filename,
        status: 'downloaded',
        size: formatBytes(sizeBytes),
        sizeBytes,
      };
    }

    const status: Exclude<StreamedDownloadOutcome, 'downloaded'> = result.outcome;
    this.logger.error(
      `${prefix} ${status.toUpperCase()} ${filename}: ${result.error ?? '—'} ` +
        `(${formatBytes(result.receivedBytes)} received, partial file discarded) — ` +
        `URL: ${entry.link}`,
    );
    return { filename, status, error: result.error };
  }

  /**
   * Downloads ALL game files for a given console, optionally filtered by
   * region strings (e.g. ["Europe"]).
   *
   * - Already-downloaded files are detected by their presence on disk and skipped.
   * - Downloads run with a configurable concurrency (default 2) to be polite
   *   to the server while still making progress.
   * - Each file gets its own try/catch so a single failure does not abort the
   *   rest of the batch.
   *
   * @param dto  Console selection, region filters, and concurrency setting.
   */
  async downloadAllGames(
    dto: DownloadAllGamesDto,
    signal?: AbortSignal,
  ): Promise<BulkDownloadResult> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const regions = dto.regions ?? [];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);

    // 1. Scrape the catalog listing
    this.logger.log(`[${catalog.label}] Fetching catalog from ${catalog.url}`);
    const allEntries = await this.scrapeDirectoryListing(catalog.url);

    // 2. Filter by regions
    const matched = allEntries.filter((entry) =>
      matchesRegions(entry.name, regions),
    );
    this.logger.log(
      `[${catalog.label}] ${matched.length} / ${allEntries.length} entries match regions: [${regions.join(', ') || 'all'}]`,
    );

    // 3. Prepare the save directory
    const saveDir = laboonPath('juegos', 'Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    // 4. Build one download task per matched entry
    const tasks = matched.map(
      (entry, i) => (): Promise<FileDownloadEntry> =>
        this.fetchOne(
          entry,
          saveDir,
          `[${catalog.label}] [${i + 1}/${matched.length}]`,
          { signal },
        ),
    );

    // 5. Run with concurrency control
    const results = await runWithConcurrency(tasks, concurrency);

    // 6. Aggregate stats
    const stats = tally(results);

    this.logger.log(
      `[${catalog.label}] Bulk download complete — ` +
        `${stats.downloaded} downloaded, ${stats.skipped} skipped, ` +
        `${stats.failed} failed, ${stats.stalled} stalled, ${stats.cancelled} cancelled. ` +
        `Total on-disk: ${formatBytes(stats.totalDownloadedSizeBytes)}`,
    );

    return {
      console: dto.console,
      consoleLabel: catalog.label,
      regions,
      totalMatched: matched.length,
      ...stats,
      totalDownloadedSize: formatBytes(stats.totalDownloadedSizeBytes),
      files: results,
    };
  }

  /**
   * Streams SSE progress events as each file in the selection is processed.
   *
   * Emits:
   *   { type: 'start',    total }
   *   { type: 'active',   index, total, filename }            -- transfer began
   *   { type: 'tick',     filename, receivedBytes, idleMs }   -- still alive (or not)
   *   { type: 'progress', index, total, filename, status, size?, sizeBytes?, error? }
   *   { type: 'done',     downloaded, skipped, failed, stalled, cancelled, ... }
   *
   * The `active` and `tick` frames are why this is no longer a generator that
   * simply awaits each batch. A batch of two multi-GiB files used to emit
   * NOTHING for however long it ran, so a dead connection and a healthy one
   * looked identical from the browser: a bar that had not moved. `tick` carries
   * the byte count and the time since the last byte, so the UI can say "stalled"
   * before the watchdog gives up, and `done` reports `cancelled` honestly when
   * the caller hung up.
   *
   * `signal` is the client's disconnect. Without it, closing the tab left the
   * server fetching gigabytes for a browser that would never read them.
   */
  async *streamDownloadSelected(
    dto: DownloadSelectedGamesDto,
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);
    const selected = dto.games;

    this.logger.log(
      `[${catalog.label}] Stream-download of ${selected.length} game(s) (concurrency=${concurrency})`,
    );

    const saveDir = laboonPath('juegos', 'Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    const frames = new FrameQueue();
    frames.push({ type: 'start', total: selected.length });

    // Live byte counters for whatever is in flight, so the ticker can report
    // both progress and its absence. Cleared when a file settles.
    const inFlight = new Map<
      string,
      { receivedBytes: number; lastByteAt: number }
    >();

    const ticker = setInterval(() => {
      const now = Date.now();
      for (const [filename, state] of inFlight) {
        frames.push({
          type: 'tick',
          filename,
          receivedBytes: state.receivedBytes,
          idleMs: now - state.lastByteAt,
          idleTimeoutMs: DEFAULT_IDLE_TIMEOUT_MS,
        });
      }
    }, TICK_INTERVAL_MS);
    ticker.unref?.();

    // The job runs alongside the drain rather than inside it: a generator that
    // awaits a whole batch before yielding cannot emit heartbeats DURING that
    // batch, which was the original defect.
    const job = (async () => {
      let globalIndex = 0;
      const settled: FileDownloadEntry[] = [];

      for (
        let batchStart = 0;
        batchStart < selected.length;
        batchStart += concurrency
      ) {
        const batch = selected.slice(batchStart, batchStart + concurrency);
        const batchResults = await Promise.all(
          batch.map((entry, j) => {
            const index = batchStart + j;
            const filename = decodeURIComponent(
              entry.link.split('/').pop() ?? entry.name,
            );
            frames.push({
              type: 'active',
              index: index + 1,
              total: selected.length,
              filename,
            });
            inFlight.set(filename, {
              receivedBytes: 0,
              lastByteAt: Date.now(),
            });
            return this.fetchOne(
              entry,
              saveDir,
              `[${catalog.label}] [${index + 1}/${selected.length}]`,
              {
                signal,
                onProgress: (receivedBytes) => {
                  const state = inFlight.get(filename);
                  if (state) {
                    state.receivedBytes = receivedBytes;
                    state.lastByteAt = Date.now();
                  }
                },
              },
            ).finally(() => inFlight.delete(filename));
          }),
        );

        for (const entry of batchResults) {
          globalIndex++;
          settled.push(entry);
          frames.push({
            type: 'progress',
            index: globalIndex,
            total: selected.length,
            ...entry,
          });
        }

        // Stop starting NEW batches once the caller has gone. Files already in
        // flight were aborted by the same signal inside `fetchOne`.
        if (signal?.aborted) break;
      }

      // Anything the loop never reached is reported, not silently dropped — a
      // summary that counts fewer files than were requested is a summary the
      // user cannot reconcile with what they selected.
      for (let i = settled.length; i < selected.length; i++) {
        settled.push({
          filename: decodeURIComponent(
            selected[i].link.split('/').pop() ?? selected[i].name,
          ),
          status: 'cancelled',
        });
      }

      const stats = tally(settled);
      frames.push({
        type: 'done',
        console: dto.console,
        consoleLabel: catalog.label,
        ...stats,
        totalDownloadedSize: formatBytes(stats.totalDownloadedSizeBytes),
        aborted: signal?.aborted === true,
      });
    })();

    try {
      // A failure inside the job must still close the stream rather than hang
      // the drain forever waiting for a frame that will never arrive.
      void job
        .catch((err: unknown) => {
          this.logger.error(
            `[${catalog.label}] Stream-download aborted: ` +
              `${err instanceof Error ? err.message : String(err)}`,
          );
        })
        // `.catch` first, then `.close`: closing off a still-rejected promise
        // would turn a logged failure into an unhandled rejection that kills
        // the process.
        .finally(() => frames.close());

      for await (const frame of frames.drain()) yield frame;
    } finally {
      clearInterval(ticker);
      frames.close();
    }
  }

  /**
   * Downloads a user-selected subset of game files for a given console.
   * The caller provides the exact entries (name + link + size) instead of
   * having the server scrape and filter the catalog — this is intended for
   * use by a front end that already presented the catalog to the user.
   *
   * Behaves identically to downloadAllGames in terms of skip-if-exists logic,
   * concurrency control, per-file error isolation, and logging.
   *
   * @param dto  Console key, selected game entries, and concurrency setting.
   */
  async downloadSelectedGames(
    dto: DownloadSelectedGamesDto,
    signal?: AbortSignal,
  ): Promise<BulkDownloadResult> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);
    const selected = dto.games;

    this.logger.log(
      `[${catalog.label}] Starting download of ${selected.length} selected game(s)`,
    );

    // Prepare the save directory
    const saveDir = laboonPath('juegos', 'Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    // Build one download task per selected entry
    const tasks = selected.map(
      (entry, i) => (): Promise<FileDownloadEntry> =>
        this.fetchOne(
          entry,
          saveDir,
          `[${catalog.label}] [${i + 1}/${selected.length}]`,
          { signal },
        ),
    );

    // Run with concurrency control
    const results = await runWithConcurrency(tasks, concurrency);

    // Aggregate stats
    const stats = tally(results);

    this.logger.log(
      `[${catalog.label}] Selected download complete — ` +
        `${stats.downloaded} downloaded, ${stats.skipped} skipped, ` +
        `${stats.failed} failed, ${stats.stalled} stalled, ${stats.cancelled} cancelled. ` +
        `Total on-disk: ${formatBytes(stats.totalDownloadedSizeBytes)}`,
    );

    return {
      console: dto.console,
      consoleLabel: catalog.label,
      regions: [],
      totalMatched: selected.length,
      ...stats,
      totalDownloadedSize: formatBytes(stats.totalDownloadedSizeBytes),
      files: results,
    };
  }
}
