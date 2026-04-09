import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createWriteStream } from 'fs';
import { mkdir, access, readdir, stat } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DELAY_MS = { min: 300, max: 800 };
const MAX_RETRIES = 2;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MANGA_ROOT = path.join(process.cwd(), 'laboon/manga/downloads/mangas');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  const ms = DELAY_MS.min + Math.random() * (DELAY_MS.max - DELAY_MS.min);
  return sleep(ms);
}

function normalizeChapterUrl(url: string): string {
  if (url.endsWith('.html')) return url;
  return url.replace(/\/?$/, '-10-1.html');
}

function buildPageUrl(base: string, page: number): string {
  return `${base.replace(/-10-\d+\.html$/, '')}-10-${page}.html`;
}

/** Slugify a string for safe folder names. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, '')   // keep alphanumerics, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: { 'User-Agent': UA },
    timeout: 15_000,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface MangaSearchResult {
  title: string;
  url: string;
  cover: string;
}

export interface MangaChapter {
  title: string;
  url: string;
}

export interface MangaChapterDownloadResult {
  chapter: string;
  imageUrls: string[];
  downloaded: number;
  skipped: number;
  failed: number;
  saveDir: string;
}

export interface MangaNovelDownloadResult {
  novelTitle: string;
  chapters: MangaChapterDownloadResult[];
  totalDownloaded: number;
  totalFailed: number;
}

export interface LocalMangaChapter {
  slug: string;
  imageCount: number;
}

export interface LocalMangaSeries {
  slug: string;
  chapters: LocalMangaChapter[];
  totalImages: number;
}

export interface LocalMangaLibrary {
  series: LocalMangaSeries[];
  totalSeries: number;
  totalChapters: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class MangaScraperService implements OnModuleDestroy {
  private readonly logger = new Logger(MangaScraperService.name);
  private browser: Browser | null = null;

  // ── Browser lifecycle ──────────────────────────────────────────────────────

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching Chromium browser…');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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

  /** Scans MANGA_ROOT on disk and returns all downloaded series and their chapters. */
  async getLocalLibrary(): Promise<LocalMangaLibrary> {
    let seriesDirs: string[] = [];
    try {
      seriesDirs = await readdir(MANGA_ROOT);
    } catch {
      // Root doesn't exist yet — empty library
      return { series: [], totalSeries: 0, totalChapters: 0 };
    }

    const series: LocalMangaSeries[] = [];
    for (const seriesSlug of seriesDirs) {
      const seriesPath = path.join(MANGA_ROOT, seriesSlug);
      const seriesStat = await stat(seriesPath).catch(() => null);
      if (!seriesStat?.isDirectory()) continue;

      const chapterDirs = await readdir(seriesPath).catch(() => [] as string[]);
      const chapters: LocalMangaChapter[] = [];

      for (const chapterSlug of chapterDirs) {
        const chapterPath = path.join(seriesPath, chapterSlug);
        const chapterStat = await stat(chapterPath).catch(() => null);
        if (!chapterStat?.isDirectory()) continue;

        const images = await readdir(chapterPath).catch(() => [] as string[]);
        const imageCount = images.filter(f => /\.(webp|jpg|jpeg|png|gif)$/i.test(f)).length;
        chapters.push({ slug: chapterSlug, imageCount });
      }

      series.push({
        slug: seriesSlug,
        chapters,
        totalImages: chapters.reduce((s, c) => s + c.imageCount, 0),
      });
    }

    return {
      series,
      totalSeries: series.length,
      totalChapters: series.reduce((s, sr) => s + sr.chapters.length, 0),
    };
  }

  /** Search novelcool for a manga title. Returns deduplicated result list. */
  async searchNovels(query: string): Promise<MangaSearchResult[]> {
    const html = await fetchHtml(`https://es.novelcool.com/search?name=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);
    const results: MangaSearchResult[] = [];
    const seen = new Set<string>();

    $('[class*="book-item"]').each((_, el) => {
      const url = $(el).find('a[href*="/novel/"]').first().attr('href') ?? '';
      if (!url || seen.has(url)) return;
      seen.add(url);

      const title = $(el).find('.book-pic').attr('title')
        ?? $(el).find('a[href*="/novel/"]').first().attr('title')
        ?? '';
      const cover = $(el).find('img[cover_url]').attr('cover_url')
        ?? $(el).find('img').first().attr('src')
        ?? '';

      results.push({ title: title.trim(), url, cover });
    });

    return results;
  }

  /** Fetches the full ordered chapter list (ch0 first → last) for a novel page. */
  async getChapterList(novelUrl: string): Promise<MangaChapter[]> {
    const html = await fetchHtml(novelUrl);
    const $ = cheerio.load(html);

    const chapters: MangaChapter[] = [];
    const seen = new Set<string>();

    $('a[href*="/chapter/"]').each((_, el) => {
      const url = $(el).attr('href') ?? '';
      const rawText = $(el).text().trim().split('\n')[0].trim();

      if (!url || seen.has(url) || rawText === 'Empieza a leer') return;
      seen.add(url);
      chapters.push({ title: rawText, url });
    });

    // Chapters are listed newest-first in the HTML; reverse so ch0/ch1 comes first.
    chapters.reverse();
    return chapters;
  }

  /**
   * Downloads a single chapter (scrape → disk).
   * @param chapterUrl  Full chapter URL from novelcool.com
   * @param saveDir     Absolute path to the folder where images will be saved
   */
  async downloadChapter(chapterUrl: string, saveDir: string): Promise<MangaChapterDownloadResult> {
    const imageUrls = await this.scrapeChapterImages(chapterUrl);
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
        this.logger.error(`  ✗ [${i + 1}/${imageUrls.length}] ${(err as Error).message}`);
        failed++;
      }

      if (i < imageUrls.length - 1) await randomDelay();
    }

    this.logger.log(`  Chapter done — ${downloaded} DL, ${skipped} skip, ${failed} fail`);
    return { chapter: path.basename(saveDir), imageUrls, downloaded, skipped, failed, saveDir };
  }

  /**
   * Downloads an entire novel (or chapter range) to disk, streaming SSE progress events.
   * Yields `data: <json>\n\n` strings for each event so the controller can pipe them.
   *
   * Event shapes:
   *   { type: 'start',    total: number, novelTitle: string }
   *   { type: 'chapter',  index: number, total: number, chapter: string,
   *                        downloaded: number, skipped: number, failed: number }
   *   { type: 'done',     novelTitle: string, totalDownloaded: number, totalFailed: number }
   */
  async *streamDownloadNovel(
    novelUrl: string,
    from: number = 1,
    to?: number,
  ): AsyncGenerator<string> {
    const novelHtml = await fetchHtml(novelUrl);
    const $n = cheerio.load(novelHtml);
    const novelTitle = slugify($n('h1').first().text().trim()) || 'manga-unknown';

    const allChapters = await this.getChapterList(novelUrl);
    const slice = allChapters.slice(from - 1, to ?? allChapters.length);

    this.logger.log(`Streaming download "${novelTitle}": chapters ${from}–${to ?? allChapters.length} (${slice.length} total)`);

    yield sse({ type: 'start', total: slice.length, novelTitle });

    let totalDownloaded = 0;
    let totalFailed = 0;

    for (let i = 0; i < slice.length; i++) {
      const ch = slice[i];
      const chSlug = slugify(ch.title) || `chapter-${i + from}`;
      const saveDir = path.join(MANGA_ROOT, novelTitle, chSlug);

      this.logger.log(`[${i + 1}/${slice.length}] ${ch.title}`);
      const result = await this.downloadChapter(ch.url, saveDir);
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

    yield sse({ type: 'done', novelTitle, totalDownloaded, totalFailed });
  }

  // ── Internal: Playwright chapter image scraping ────────────────────────────

  private async scrapeChapterImages(chapterUrl: string): Promise<string[]> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({ userAgent: UA });

    try {
      const firstPageUrl = normalizeChapterUrl(chapterUrl);
      const totalPages = await this.detectTotalPages(context, firstPageUrl);
      this.logger.log(`  ${totalPages} page(s) detected`);

      const canonicalBase = chapterUrl.replace(/-10-\d+\.html$/, '').replace(/\/?$/, '');
      const allImages: string[] = [];

      for (let page = 1; page <= totalPages; page++) {
        const images = await this.scrapePageWithRetry(context, buildPageUrl(canonicalBase, page), page);
        allImages.push(...images);
        if (page < totalPages) await randomDelay();
      }

      return [...new Set(allImages)];
    } finally {
      await context.close();
    }
  }

  private async detectTotalPages(
    context: import('playwright').BrowserContext,
    firstPageUrl: string,
  ): Promise<number> {
    const page = await context.newPage();
    try {
      await page.goto(firstPageUrl, { waitUntil: 'domcontentloaded' });
      // Use $eval (first match only) — $$eval would double-count header+footer selects
      const count = await page.$eval(
        'select.sl-page',
        el => el.querySelectorAll('option').length,
      ).catch(() => 0);
      return count > 0 ? count : 1;
    } finally {
      await page.close();
    }
  }

  private async scrapePageWithRetry(
    context: import('playwright').BrowserContext,
    pageUrl: string,
    pageNum: number,
  ): Promise<string[]> {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        return await this.scrapeSinglePage(context, pageUrl);
      } catch (err) {
        if (attempt <= MAX_RETRIES) {
          this.logger.warn(`Page ${pageNum} attempt ${attempt} failed, retrying… (${(err as Error).message})`);
          await sleep(1000 * attempt);
        } else {
          this.logger.error(`Page ${pageNum} failed after ${MAX_RETRIES} retries: ${(err as Error).message}`);
          return [];
        }
      }
    }
    return [];
  }

  private async scrapeSinglePage(
    context: import('playwright').BrowserContext,
    pageUrl: string,
  ): Promise<string[]> {
    const page = await context.newPage();
    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.mangaread-manga-pic', { timeout: 15_000 });
      return await page.$$eval('.mangaread-manga-pic', imgs =>
        imgs
          .map(img => (img as HTMLImageElement).src)
          .filter(src => !!src && src.startsWith('http')),
      );
    } finally {
      await page.close();
    }
  }

  // ── Internal: image download ───────────────────────────────────────────────

  private async downloadImage(url: string, filePath: string): Promise<void> {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30_000,
      headers: { 'User-Agent': UA, 'Referer': 'https://es.novelcool.com/' },
    });
    await pipeline(response.data, createWriteStream(filePath));
  }

  private guessExtension(url: string): string {
    const match = url.split('?')[0].match(/\.(webp|jpg|jpeg|png|gif)$/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }
}
