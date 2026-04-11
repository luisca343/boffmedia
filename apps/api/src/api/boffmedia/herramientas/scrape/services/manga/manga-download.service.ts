// ---------------------------------------------------------------------------
// MangaDownloadService — owns the Playwright browser lifecycle and handles
// chapter image downloading and SSE streaming. Delegates scraping logic to
// the appropriate IMangaScraper resolved from MangaScraperRegistry.
// ---------------------------------------------------------------------------

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir, access } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';

import { MangaScraperRegistry } from './manga-registry.service';
import { chapterSlug, slugify } from './chapter-normalizer';
import { UA, randomDelay } from './manga-http';
import { MangaChapterDownloadResult } from './manga.types';

const MANGA_ROOT = path.join(process.cwd(), 'laboon/manga/downloads/mangas');

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
export class MangaDownloadService implements OnModuleDestroy {
  private readonly logger = new Logger(MangaDownloadService.name);
  private browser: Browser | null = null;

  constructor(private readonly registry: MangaScraperRegistry) {}

  // ── Browser lifecycle ──────────────────────────────────────────────────────

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching Chromium browser…');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',   // prevents /dev/shm exhaustion in Docker
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Downloads a single chapter to disk.
   * Resolves the correct scraper from the chapter URL, creates a browser
   * context for scrapers that require it, then saves each image.
   */
  async downloadChapter(
    chapterUrl: string,
    saveDir: string,
  ): Promise<MangaChapterDownloadResult> {
    const scraper = this.registry.resolve(chapterUrl);
    const browser = await this.getBrowser();
    const context = await browser.newContext({ userAgent: UA });

    let imageUrls: string[] = [];
    try {
      imageUrls = await scraper.getChapterImages(chapterUrl, context);
    } finally {
      await context.close();
    }

    return this.saveImages(imageUrls, saveDir);
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
  ): AsyncGenerator<string> {
    const scraper = this.registry.resolve(novelUrl);

    const rawTitle = await scraper.getTitle(novelUrl);
    const novelTitle = slugify(rawTitle) || 'manga-unknown';

    const allChapters = await scraper.getChapterList(novelUrl);
    const slice = allChapters.slice(from - 1, to ?? allChapters.length);

    this.logger.log(
      `Streaming download "${novelTitle}" via ${scraper.name}: ` +
      `chapters ${from}–${to ?? allChapters.length} (${slice.length} total)`,
    );

    yield sse({ type: 'start', total: slice.length, novelTitle });

    const browser = await this.getBrowser();
    const context = await browser.newContext({ userAgent: UA });

    let totalDownloaded = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < slice.length; i++) {
        const ch = slice[i];
        const slug = chapterSlug(ch.number, ch.title);
        const saveDir = path.join(MANGA_ROOT, novelTitle, slug);

        this.logger.log(`[${i + 1}/${slice.length}] ${ch.title} → ${slug}`);

        let imageUrls: string[] = [];
        try {
          imageUrls = await scraper.getChapterImages(ch.url, context);
        } catch (err) {
          this.logger.error(
            `Failed to scrape images for "${ch.title}": ${(err as Error).message}`,
          );
        }

        const result = await this.saveImages(imageUrls, saveDir, ch.title);
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

  // ── Private: image persistence ─────────────────────────────────────────────

  private async saveImages(
    imageUrls: string[],
    saveDir: string,
    chapterTitle?: string,
  ): Promise<MangaChapterDownloadResult> {
    await mkdir(saveDir, { recursive: true });

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const ext = this.guessExtension(url);
      const filename = `${String(i + 1).padStart(3, '0')}${ext}`;
      const filePath = path.join(saveDir, filename);

      if (await fileExists(filePath)) {
        skipped++;
        continue;
      }

      try {
        await this.downloadImage(url, filePath);
        downloaded++;
      } catch (err) {
        this.logger.error(
          `  ✗ [${i + 1}/${imageUrls.length}] ${(err as Error).message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `  ${chapterTitle ?? path.basename(saveDir)} — ${downloaded} DL, ${skipped} skip, ${failed} fail`,
    );

    return {
      chapter: path.basename(saveDir),
      imageUrls,
      downloaded,
      skipped,
      failed,
      saveDir,
    };
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
