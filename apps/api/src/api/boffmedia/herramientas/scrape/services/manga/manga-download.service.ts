// ---------------------------------------------------------------------------
// MangaDownloadService — owns the Playwright browser lifecycle and handles
// chapter image downloading (saved as .cbz or .epub) and SSE streaming.
//
// ── Format switch ──────────────────────────────────────────────────────────
// Change OUTPUT_FORMAT below to toggle the archive format for all downloads.
// ---------------------------------------------------------------------------

import { Injectable, Logger } from '@nestjs/common';
import { Browser } from 'playwright';
import AdmZip from 'adm-zip';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir, access, readdir, rm } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';

import { MangaBrowserService } from './manga-browser.service';
import { MangaScraperRegistry } from './manga-registry.service';
import { MangaConfigService } from './manga-config.service';
import { chapterFilename, sanitizeForFilesystem } from './chapter-normalizer';
import { UA, randomDelay, getProxy, toPlaywrightProxy } from './manga-http';
import { MangaChapterDownloadResult } from './manga.types';
import { MANGA_ROOT } from './manga-constants';
import { buildEpub } from './manga-epub.builder';

export type MangaOutputFormat = 'cbz' | 'epub';

/** Change this constant to switch the output format for all downloads. */
const OUTPUT_FORMAT: MangaOutputFormat = 'epub';

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class MangaDownloadService {
  private readonly logger = new Logger(MangaDownloadService.name);

  constructor(
    private readonly registry: MangaScraperRegistry,
    private readonly browserService: MangaBrowserService,
    private readonly configService: MangaConfigService,
  ) {}

  // ── Browser ────────────────────────────────────────────────────────────────

  private getBrowser(): Promise<Browser> {
    return this.browserService.getBrowser();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Downloads a single chapter.
   * `outputPath` should include the file extension (the format is determined
   * by OUTPUT_FORMAT regardless of the extension provided).
   */
  async downloadChapter(
    chapterUrl: string,
    outputPath: string,
  ): Promise<MangaChapterDownloadResult> {
    const scraper = this.registry.resolve(chapterUrl);
    const browser = await this.getBrowser();
    const proxy = this.browserService.getTunnelEnabled()
      ? await getProxy()
      : undefined;
    const context = await browser.newContext({
      userAgent: UA,
      ...(proxy ? { proxy: toPlaywrightProxy(proxy) } : {}),
    });

    let imageUrls: string[] = [];
    try {
      imageUrls = await scraper.getChapterImages(chapterUrl, context);
    } finally {
      await context.close();
    }

    return this.saveChapter(imageUrls, outputPath);
  }

  /**
   * Downloads an entire novel (or chapter range) to disk and streams
   * SSE progress events as an async generator.
   *
   * SSE event shapes:
   *   { type: 'start',   total: number, novelTitle: string }
   *   { type: 'chapter', index: number, total: number, chapter: string,
   *                       downloaded: number, skipped: number, failed: number }
   *   { type: 'done',    novelTitle: string, totalDownloaded: number, totalFailed: number }
   */
  async *streamDownloadNovel(
    novelUrl: string,
    from: number = 1,
    to?: number,
    skipDownloaded = true,
  ): AsyncGenerator<string> {
    const scraper = this.registry.resolve(novelUrl);

    const rawTitle = await scraper.getTitle(novelUrl);
    const novelTitle = sanitizeForFilesystem(rawTitle) || 'manga-unknown';

    const allChapters = await scraper.getChapterList(novelUrl);
    const slice = allChapters.slice(from - 1, to ?? allChapters.length);

    this.logger.log(
      `Streaming download "${novelTitle}" via ${scraper.name}: ` +
        `chapters ${from}–${to ?? allChapters.length} (${slice.length} total)`,
    );

    // Record source URL the first time this series is downloaded
    await this.configService.setSourceUrlIfMissing(novelTitle, novelUrl);

    yield sse({ type: 'start', total: slice.length, novelTitle });

    const browser = await this.getBrowser();
    const proxy = this.browserService.getTunnelEnabled()
      ? await getProxy()
      : undefined;
    if (!proxy && this.browserService.getTunnelEnabled()) {
      this.logger.warn(
        'Tunnel enabled but no proxy available — browser contexts will use direct connection',
      );
    }
    const context = await browser.newContext({
      userAgent: UA,
      ...(proxy ? { proxy: toPlaywrightProxy(proxy) } : {}),
    });

    let totalDownloaded = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < slice.length; i++) {
        const ch = slice[i];
        const name = chapterFilename(ch.number, ch.title);
        const seriesDir = path.join(MANGA_ROOT, novelTitle);
        const outputPath = path.join(seriesDir, `${name}.${OUTPUT_FORMAT}`);

        this.logger.log(
          `[${i + 1}/${slice.length}] ${ch.title} → ${name}.${OUTPUT_FORMAT}`,
        );

        let imageUrls: string[] = [];
        try {
          imageUrls = await scraper.getChapterImages(ch.url, context);
        } catch (err: unknown) {
          this.logger.error(
            `Failed to scrape images for "${ch.title}": ${(err as Error).message}`,
          );
        }

        const result = await this.saveChapter(
          imageUrls,
          outputPath,
          ch.title,
          ch.number,
          novelTitle,
          skipDownloaded,
        );
        totalDownloaded += result.downloaded;
        totalFailed += result.failed;

        yield sse({
          type: 'chapter',
          index: i + 1,
          total: slice.length,
          chapter: result.chapter,
          downloaded: result.downloaded,
          skipped: result.skipped,
          failed: result.failed,
        });

        if (i < slice.length - 1) await randomDelay();
      }
    } finally {
      await context.close();
    }

    yield sse({ type: 'done', novelTitle, totalDownloaded, totalFailed });
  }

  // ── Private: format dispatcher ─────────────────────────────────────────────

  /**
   * Routes to saveCbz or saveEpub based on OUTPUT_FORMAT.
   * `outputPath` must include the correct extension (.cbz or .epub).
   */
  private saveChapter(
    imageUrls: string[],
    outputPath: string,
    chapterTitle?: string,
    chapterNumber?: number | null,
    seriesTitle?: string,
    skipIfExists = true,
  ): Promise<MangaChapterDownloadResult> {
    if (OUTPUT_FORMAT === 'epub') {
      return this.saveEpub(
        imageUrls,
        outputPath,
        chapterTitle,
        chapterNumber,
        seriesTitle,
        skipIfExists,
      );
    }
    return this.saveCbz(
      imageUrls,
      outputPath,
      chapterTitle,
      chapterNumber,
      seriesTitle,
      skipIfExists,
    );
  }

  // ── Private: CBZ persistence ───────────────────────────────────────────────

  /**
   * Downloads all images for a chapter and packages them as a .cbz (zip) file.
   *
   * If the .cbz already exists, the chapter is skipped entirely.
   * Images are first downloaded to a temp directory, then zipped, then the
   * temp directory is deleted.
   */
  private async saveCbz(
    imageUrls: string[],
    cbzPath: string,
    chapterTitle?: string,
    chapterNumber?: number | null,
    seriesTitle?: string,
    skipIfExists = true,
  ): Promise<MangaChapterDownloadResult> {
    const chapterName = path.basename(cbzPath, '.cbz');

    // Skip if CBZ already exists (when skipIfExists is true).
    if (skipIfExists && (await fileExists(cbzPath))) {
      this.logger.log(
        `  ${chapterTitle ?? chapterName} — skip (already downloaded)`,
      );
      return {
        chapter: chapterName,
        imageUrls,
        downloaded: 0,
        skipped: 1,
        failed: 0,
        saveDir: path.dirname(cbzPath),
      };
    }

    const seriesDir = path.dirname(cbzPath);
    await mkdir(seriesDir, { recursive: true });

    const tempDir = `${cbzPath}.tmp`;
    await mkdir(tempDir, { recursive: true });

    let downloaded = 0;
    let failed = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const ext = this.guessExtension(url);
      const filename = `${String(i + 1).padStart(3, '0')}${ext}`;
      const filePath = path.join(tempDir, filename);

      try {
        await this.downloadImage(url, filePath);
        downloaded++;
      } catch (err: unknown) {
        this.logger.error(
          `  ✗ [${i + 1}/${imageUrls.length}] ${(err as Error).message}`,
        );
        failed++;
      }
    }

    // Pack downloaded images into a CBZ archive.
    if (downloaded > 0) {
      const zip = new AdmZip();
      const files = await readdir(tempDir);
      for (const file of files) {
        zip.addLocalFile(path.join(tempDir, file));
      }
      // Embed ComicInfo.xml so Komga/Kavita recognise the chapter number correctly.
      zip.addFile(
        'ComicInfo.xml',
        Buffer.from(
          this.buildComicInfo(
            seriesTitle,
            chapterTitle,
            chapterNumber,
            downloaded,
          ),
          'utf-8',
        ),
      );
      zip.writeZip(cbzPath);
    }

    // Clean up temp directory.
    await rm(tempDir, { recursive: true, force: true });

    this.logger.log(
      `  ${chapterTitle ?? chapterName} — ${downloaded} DL, 0 skip, ${failed} fail`,
    );

    return {
      chapter: chapterName,
      imageUrls,
      downloaded,
      skipped: 0,
      failed,
      saveDir: seriesDir,
    };
  }

  // ── Private: EPUB persistence ──────────────────────────────────────────────

  /**
   * Downloads all images for a chapter and packages them as an EPUB 3 file.
   *
   * If the .epub already exists, the chapter is skipped entirely.
   * Images are downloaded to a temp directory, then built into an EPUB via
   * buildEpub(), then the temp directory is deleted.
   */
  private async saveEpub(
    imageUrls: string[],
    epubPath: string,
    chapterTitle?: string,
    chapterNumber?: number | null,
    seriesTitle?: string,
    skipIfExists = true,
  ): Promise<MangaChapterDownloadResult> {
    const chapterName = path.basename(epubPath, '.epub');

    if (skipIfExists && (await fileExists(epubPath))) {
      this.logger.log(
        `  ${chapterTitle ?? chapterName} — skip (already downloaded)`,
      );
      return {
        chapter: chapterName,
        imageUrls,
        downloaded: 0,
        skipped: 1,
        failed: 0,
        saveDir: path.dirname(epubPath),
      };
    }

    const seriesDir = path.dirname(epubPath);
    await mkdir(seriesDir, { recursive: true });

    const tempDir = `${epubPath}.tmp`;
    await mkdir(tempDir, { recursive: true });

    const { downloaded, failed, files } = await this.downloadImagesToDir(
      imageUrls,
      tempDir,
    );

    if (downloaded > 0) {
      await buildEpub({
        imageFiles: files,
        outputPath: epubPath,
        seriesTitle,
        chapterTitle,
        chapterNumber,
      });
    }

    await rm(tempDir, { recursive: true, force: true });

    this.logger.log(
      `  ${chapterTitle ?? chapterName} — ${downloaded} DL, 0 skip, ${failed} fail`,
    );

    return {
      chapter: chapterName,
      imageUrls,
      downloaded,
      skipped: 0,
      failed,
      saveDir: seriesDir,
    };
  }

  // ── Private: shared helpers ────────────────────────────────────────────────

  /** Downloads all image URLs into tempDir; returns counts and sorted file paths. */
  private async downloadImagesToDir(
    imageUrls: string[],
    tempDir: string,
  ): Promise<{ downloaded: number; failed: number; files: string[] }> {
    let downloaded = 0;
    let failed = 0;
    const files: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const ext = this.guessExtension(url);
      const filename = `${String(i + 1).padStart(3, '0')}${ext}`;
      const filePath = path.join(tempDir, filename);

      try {
        await this.downloadImage(url, filePath);
        files.push(filePath);
        downloaded++;
      } catch (err: unknown) {
        this.logger.error(
          `  ✗ [${i + 1}/${imageUrls.length}] ${(err as Error).message}`,
        );
        failed++;
      }
    }

    return { downloaded, failed, files };
  }

  private buildComicInfo(
    series?: string,
    title?: string,
    number?: number | null,
    pageCount?: number,
  ): string {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    ];
    if (series) lines.push(`  <Series>${esc(series)}</Series>`);
    if (title) lines.push(`  <Title>${esc(title)}</Title>`);
    if (number != null) lines.push(`  <Number>${number}</Number>`);
    if (pageCount) lines.push(`  <PageCount>${pageCount}</PageCount>`);
    lines.push('</ComicInfo>');
    return lines.join('\n');
  }

  private async downloadImage(url: string, filePath: string): Promise<void> {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30_000,
      headers: { 'User-Agent': UA, Referer: 'https://es.novelcool.com/' },
    });
    await pipeline(response.data, createWriteStream(filePath));
  }

  private guessExtension(url: string): string {
    const match = url.split('?')[0].match(/\.(webp|jpg|jpeg|png|gif)$/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }
}
