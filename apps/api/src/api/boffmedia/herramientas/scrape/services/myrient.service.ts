import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';
import { access, mkdir, readdir, stat } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { GameFileEntry } from '../entities/game-file.entity';
import { EuropeAggregateResult } from '../entities/europe-aggregate.entity';
import { DownloadResult } from '../entities/download-result.entity';
import { BulkDownloadResult, FileDownloadEntry } from '../entities/bulk-download-result.entity';
import { LocalGameEntry, LocalGamesResult } from '../entities/local-games.entity';
import { DownloadAllGamesDto } from '../dto/download-all-games.dto';
import { DownloadSelectedGamesDto } from '../dto/download-selected-games.dto';
import { MyrientConsole } from '../enums/myrient-console.enum';
import { CONSOLE_CATALOG, MYRIENT_BASE_URL } from '../constants/myrient-catalog.constants';

// ---------------------------------------------------------------------------
// Size helpers
// ---------------------------------------------------------------------------

const SIZE_UNITS: Record<string, number> = {
  b:   1,
  kb:  1_000,
  mb:  1_000_000,
  gb:  1_000_000_000,
  tb:  1_000_000_000_000,
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
  if (bytes >= SIZE_UNITS.tib) return `${(bytes / SIZE_UNITS.tib).toFixed(2)} TiB`;
  if (bytes >= SIZE_UNITS.gib) return `${(bytes / SIZE_UNITS.gib).toFixed(2)} GiB`;
  if (bytes >= SIZE_UNITS.mib) return `${(bytes / SIZE_UNITS.mib).toFixed(2)} MiB`;
  if (bytes >= SIZE_UNITS.kib) return `${(bytes / SIZE_UNITS.kib).toFixed(2)} KiB`;
  return `${bytes} B`;
}

/** Returns true when a filename matches at least one of the provided region strings. */
function matchesRegions(name: string, regions: string[]): boolean {
  if (!regions.length) return true;
  return regions.some(region => new RegExp(`\\b${region}\\b`, 'i').test(name));
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
  async getLocalGames(consoleKey: MyrientConsole, regions: string[]): Promise<LocalGamesResult> {
    const catalog = CONSOLE_CATALOG[consoleKey];
    const saveDir = path.join(process.cwd(), 'laboon/juegos/Roms', catalog.localFolder);

    let entries: LocalGameEntry[] = [];
    try {
      const filenames = await readdir(saveDir);
      const stats = await Promise.all(
        filenames.map(async (filename): Promise<LocalGameEntry | null> => {
          try {
            const filePath = path.join(saveDir, filename);
            const { size: sizeBytes, isFile } = await stat(filePath).then(s => ({ size: s.size, isFile: s.isFile() }));
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
      entries = entries.filter(e => matchesRegions(e.filename, regions));
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
   * Scrapes a console's catalog and returns the entries filtered by the
   * provided region strings, together with the aggregated total size.
   * Pass an empty regions array to get everything.
   */
  async scrapeCatalog(consoleKey: MyrientConsole, regions: string[]): Promise<EuropeAggregateResult> {
    const catalog = CONSOLE_CATALOG[consoleKey];
    const all = await this.scrapeDirectoryListing(catalog.url);
    const filtered = regions.length
      ? all.filter(entry => matchesRegions(entry.name, regions))
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
   */
  async scrapeDirectoryListing(url: string): Promise<GameFileEntry[]> {
    const { data: html } = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 30_000,
    });

    const $ = cheerio.load(html);
    const entries: GameFileEntry[] = [];

    // Myrient uses h5ai – each file row is a <tr class="file"> inside <tbody id="fallback-tbody">
    // Fallback: iterate over all <tr> elements that contain a download link.
    $('tr').each((_i, row) => {
      const $row = $(row);

      // The file link lives in an <a> whose href points directly to a file (not a directory).
      const $anchor = $row.find('a[href]').filter((_j, el) => {
        const href = $(el).attr('href') ?? '';
        // Exclude parent-directory links and directory entries (trailing slash).
        return !href.endsWith('/') && href !== '../' && href !== './';
      }).first();

      if (!$anchor.length) return;

      const rawHref = $anchor.attr('href');
      if (!rawHref) return;

      // Resolve relative hrefs against the directory URL being scraped so we get
      // the full path (e.g. /files/No-Intro/Nintendo - Game Boy/game.zip) instead
      // of just the domain root.
      const link = new URL(rawHref, url).href;

      // Game name: prefer the <a> text, fall back to decoding the href filename.
      const anchorText = $anchor.text().trim();
      const name = anchorText || decodeURIComponent(rawHref.split('/').pop() ?? rawHref);

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
   * @param url  Full URL to the zip/cia/3ds file to download.
   * @returns    Metadata about the saved file.
   */
  async downloadGame(url: string): Promise<DownloadResult> {
    const townPath = path.join(process.cwd(), 'laboon/juegos/myrient/3DS');
    await mkdir(townPath, { recursive: true });

    // Derive a safe filename from the URL.
    const filename = decodeURIComponent(url.split('/').pop() ?? 'unknown');
    const filePath = path.join(townPath, filename);

    const response = await axios.get<NodeJS.ReadableStream>(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)',
      },
      timeout: 0, // no timeout – files can be several GiB
    });

    const writeStream = createWriteStream(filePath);
    await pipeline(response.data, writeStream);

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
  async downloadAllGames(dto: DownloadAllGamesDto): Promise<BulkDownloadResult> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const regions = dto.regions ?? [];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);

    // 1. Scrape the catalog listing
    this.logger.log(`[${catalog.label}] Fetching catalog from ${catalog.url}`);
    const allEntries = await this.scrapeDirectoryListing(catalog.url);

    // 2. Filter by regions
    const matched = allEntries.filter(entry => matchesRegions(entry.name, regions));
    this.logger.log(`[${catalog.label}] ${matched.length} / ${allEntries.length} entries match regions: [${regions.join(', ') || 'all'}]`);

    // 3. Prepare the save directory
    const saveDir = path.join(process.cwd(), 'laboon/juegos/Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    // 4. Build one download task per matched entry
    const tasks = matched.map((entry, i) => async (): Promise<FileDownloadEntry> => {
      const filename = decodeURIComponent(entry.link.split('/').pop() ?? entry.name);
      const filePath = path.join(saveDir, filename);
      const prefix = `[${catalog.label}] [${i + 1}/${matched.length}]`;

      // Skip if already on disk
      if (await fileExists(filePath)) {
        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} SKIP (already exists) ${filename}`);
        return { filename, status: 'skipped', size: formatBytes(sizeBytes), sizeBytes };
      }

      this.logger.log(`${prefix} Downloading ${filename} (${entry.size || 'unknown size'}) — ${entry.link}`);
      try {
        const response = await axios.get<NodeJS.ReadableStream>(entry.link, {
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)' },
          timeout: 0,
        });

        const writeStream = createWriteStream(filePath);
        await pipeline(response.data, writeStream);

        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} OK ${filename} → ${formatBytes(sizeBytes)}`);
        return { filename, status: 'downloaded', size: formatBytes(sizeBytes), sizeBytes };
      } catch (err) {
        this.logger.error(`${prefix} FAILED ${filename}: ${err?.message ?? err} — URL: ${entry.link}`);
        return { filename, status: 'failed', error: String(err?.message ?? err) };
      }
    });

    // 5. Run with concurrency control
    const results = await runWithConcurrency(tasks, concurrency);

    // 6. Aggregate stats
    const downloaded = results.filter(r => r.status === 'downloaded').length;
    const skipped    = results.filter(r => r.status === 'skipped').length;
    const failed     = results.filter(r => r.status === 'failed').length;
    const totalDownloadedSizeBytes = results
      .filter(r => r.status === 'downloaded' || r.status === 'skipped')
      .reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0);

    this.logger.log(
      `[${catalog.label}] Bulk download complete — ` +
      `${downloaded} downloaded, ${skipped} skipped, ${failed} failed. ` +
      `Total on-disk: ${formatBytes(totalDownloadedSizeBytes)}`,
    );

    return {
      console: dto.console,
      consoleLabel: catalog.label,
      regions,
      totalMatched: matched.length,
      downloaded,
      skipped,
      failed,
      totalDownloadedSize: formatBytes(totalDownloadedSizeBytes),
      totalDownloadedSizeBytes,
      files: results,
    };
  }

  /**
   * Streams SSE progress events as each file in the selection is processed.
   *
   * Emits:
   *   { type: 'start',    total }
   *   { type: 'progress', index, total, filename, status, size?, sizeBytes?, error? }
   *   { type: 'done',     downloaded, skipped, failed,
   *                       totalDownloadedSize, totalDownloadedSizeBytes, console, consoleLabel }
   *
   * Files are processed in batches of `concurrency`. Each batch runs in parallel;
   * results are yielded in submission order once the batch settles.
   */
  async *streamDownloadSelected(dto: DownloadSelectedGamesDto): AsyncGenerator<string> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);
    const selected = dto.games;

    this.logger.log(`[${catalog.label}] Stream-download of ${selected.length} game(s) (concurrency=${concurrency})`);

    const saveDir = path.join(process.cwd(), 'laboon/juegos/Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    yield `data: ${JSON.stringify({ type: 'start', total: selected.length })}\n\n`;

    let downloaded = 0, skipped = 0, failed = 0, totalDownloadedSizeBytes = 0;
    let globalIndex = 0;

    const downloadOne = async (entry: GameFileEntry, i: number): Promise<FileDownloadEntry> => {
      const filename = decodeURIComponent(entry.link.split('/').pop() ?? entry.name);
      const filePath = path.join(saveDir, filename);
      const prefix = `[${catalog.label}] [${i + 1}/${selected.length}]`;

      if (await fileExists(filePath)) {
        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} SKIP ${filename}`);
        return { filename, status: 'skipped', size: formatBytes(sizeBytes), sizeBytes };
      }

      this.logger.log(`${prefix} Downloading ${filename} — ${entry.link}`);
      try {
        const response = await axios.get<NodeJS.ReadableStream>(entry.link, {
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)' },
          timeout: 0,
        });
        const writeStream = createWriteStream(filePath);
        await pipeline(response.data, writeStream);
        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} OK ${filename} → ${formatBytes(sizeBytes)}`);
        return { filename, status: 'downloaded', size: formatBytes(sizeBytes), sizeBytes };
      } catch (err) {
        this.logger.error(`${prefix} FAILED ${filename}: ${err?.message ?? err}`);
        return { filename, status: 'failed', error: String(err?.message ?? err) };
      }
    };

    // Process in batches of `concurrency`, yield each result in order after the batch settles
    for (let batchStart = 0; batchStart < selected.length; batchStart += concurrency) {
      const batch = selected.slice(batchStart, batchStart + concurrency);
      const batchResults = await Promise.all(
        batch.map((entry, j) => downloadOne(entry, batchStart + j)),
      );

      for (const entry of batchResults) {
        globalIndex++;
        if (entry.status === 'downloaded') { downloaded++; totalDownloadedSizeBytes += entry.sizeBytes ?? 0; }
        else if (entry.status === 'skipped') { skipped++;  totalDownloadedSizeBytes += entry.sizeBytes ?? 0; }
        else { failed++; }

        yield `data: ${JSON.stringify({
          type: 'progress',
          index: globalIndex,
          total: selected.length,
          ...entry,
        })}\n\n`;
      }
    }

    yield `data: ${JSON.stringify({
      type: 'done',
      console: dto.console,
      consoleLabel: catalog.label,
      downloaded,
      skipped,
      failed,
      totalDownloadedSize: formatBytes(totalDownloadedSizeBytes),
      totalDownloadedSizeBytes,
    })}\n\n`;
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
  async downloadSelectedGames(dto: DownloadSelectedGamesDto): Promise<BulkDownloadResult> {
    const catalog = CONSOLE_CATALOG[dto.console];
    const concurrency = Math.min(Math.max(dto.concurrency ?? 2, 1), 5);
    const selected = dto.games;

    this.logger.log(`[${catalog.label}] Starting download of ${selected.length} selected game(s)`);

    // Prepare the save directory
    const saveDir = path.join(process.cwd(), 'laboon/juegos/Roms', catalog.localFolder);
    await mkdir(saveDir, { recursive: true });

    // Build one download task per selected entry
    const tasks = selected.map((entry, i) => async (): Promise<FileDownloadEntry> => {
      const filename = decodeURIComponent(entry.link.split('/').pop() ?? entry.name);
      const filePath = path.join(saveDir, filename);
      const prefix = `[${catalog.label}] [${i + 1}/${selected.length}]`;

      // Skip if already on disk
      if (await fileExists(filePath)) {
        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} SKIP (already exists) ${filename}`);
        return { filename, status: 'skipped', size: formatBytes(sizeBytes), sizeBytes };
      }

      this.logger.log(`${prefix} Downloading ${filename} (${entry.size || 'unknown size'}) — ${entry.link}`);
      try {
        const response = await axios.get<NodeJS.ReadableStream>(entry.link, {
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FicusLabs-Scraper/1.0)' },
          timeout: 0,
        });

        const writeStream = createWriteStream(filePath);
        await pipeline(response.data, writeStream);

        const { size: sizeBytes } = await stat(filePath);
        this.logger.log(`${prefix} OK ${filename} → ${formatBytes(sizeBytes)}`);
        return { filename, status: 'downloaded', size: formatBytes(sizeBytes), sizeBytes };
      } catch (err) {
        this.logger.error(`${prefix} FAILED ${filename}: ${err?.message ?? err} — URL: ${entry.link}`);
        return { filename, status: 'failed', error: String(err?.message ?? err) };
      }
    });

    // Run with concurrency control
    const results = await runWithConcurrency(tasks, concurrency);

    // Aggregate stats
    const downloaded = results.filter(r => r.status === 'downloaded').length;
    const skipped    = results.filter(r => r.status === 'skipped').length;
    const failed     = results.filter(r => r.status === 'failed').length;
    const totalDownloadedSizeBytes = results
      .filter(r => r.status === 'downloaded' || r.status === 'skipped')
      .reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0);

    this.logger.log(
      `[${catalog.label}] Selected download complete — ` +
      `${downloaded} downloaded, ${skipped} skipped, ${failed} failed. ` +
      `Total on-disk: ${formatBytes(totalDownloadedSizeBytes)}`,
    );

    return {
      console: dto.console,
      consoleLabel: catalog.label,
      regions: [],
      totalMatched: selected.length,
      downloaded,
      skipped,
      failed,
      totalDownloadedSize: formatBytes(totalDownloadedSizeBytes),
      totalDownloadedSizeBytes,
      files: results,
    };
  }
}
