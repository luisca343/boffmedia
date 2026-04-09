import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir, access } from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';

const DELAY_MS = { min: 300, max: 800 };
const MAX_RETRIES = 2;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

function buildPageUrl(baseChapterUrl: string, page: number): string {
  const canonical = baseChapterUrl.replace(/-10-\d+\.html$/, '');
  return `${canonical}-10-${page}.html`;
}

/** Extracts chapter slug from URL, e.g. "Cap-tulo-1" from ".../chapter/Cap-tulo-1/2454249" */
function chapterSlugFromUrl(url: string): string {
  const match = url.match(/\/chapter\/([^/]+)\//);
  return match ? match[1] : 'chapter-unknown';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface MangaChapterResult {
  imageUrls: string[];
  downloaded: number;
  skipped: number;
  failed: number;
  saveDir: string;
}

@Injectable()
export class MangaScraperService implements OnModuleDestroy {
  private readonly logger = new Logger(MangaScraperService.name);
  private browser: Browser | null = null;

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

  async scrapeAndDownloadChapter(chapterUrl: string): Promise<MangaChapterResult> {
    const imageUrls = await this.scrapeChapter(chapterUrl);

    const slug = chapterSlugFromUrl(chapterUrl);
    const saveDir = path.join(process.cwd(), 'laboon/manga/downloads/mangas/Raeliana', slug);
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
        this.logger.log(`Skipping [${i + 1}/${imageUrls.length}] ${filename} (exists)`);
        skipped++;
        continue;
      }

      try {
        await this.downloadImage(url, filePath);
        this.logger.log(`Downloaded [${i + 1}/${imageUrls.length}] ${filename}`);
        downloaded++;
      } catch (err) {
        this.logger.error(`Failed [${i + 1}/${imageUrls.length}] ${filename}: ${(err as Error).message}`);
        failed++;
      }

      if (i < imageUrls.length - 1) await randomDelay();
    }

    this.logger.log(`Done — ${downloaded} downloaded, ${skipped} skipped, ${failed} failed → ${saveDir}`);
    return { imageUrls, downloaded, skipped, failed, saveDir };
  }

  private async scrapeChapter(chapterUrl: string): Promise<string[]> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({ userAgent: USER_AGENT });

    try {
      const firstPageUrl = normalizeChapterUrl(chapterUrl);
      const totalPages = await this.detectTotalPages(context, firstPageUrl);
      this.logger.log(`Chapter has ${totalPages} page(s). Starting scrape…`);

      const canonicalBase = chapterUrl.replace(/-10-\d+\.html$/, '').replace(/\/?$/, '');
      const allImages: string[] = [];

      for (let page = 1; page <= totalPages; page++) {
        const pageUrl = buildPageUrl(canonicalBase, page);
        const images = await this.scrapePageWithRetry(context, pageUrl, page);
        allImages.push(...images);
        this.logger.log(`Page ${page}/${totalPages}: extracted ${images.length} image(s).`);
        if (page < totalPages) await randomDelay();
      }

      return [...new Set(allImages)];
    } finally {
      await context.close();
    }
  }

  private async detectTotalPages(context: import('playwright').BrowserContext, firstPageUrl: string): Promise<number> {
    const page = await context.newPage();
    try {
      await page.goto(firstPageUrl, { waitUntil: 'domcontentloaded' });

      // Use $eval (first match only) — $$eval would double-count header+footer selects
      const optionCount = await page.$eval(
        'select.sl-page',
        select => select.querySelectorAll('option').length,
      ).catch(() => 0);

      return optionCount > 0 ? optionCount : 1;
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

  private async downloadImage(url: string, filePath: string): Promise<void> {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 30_000,
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://es.novelcool.com/',
      },
    });
    await pipeline(response.data, createWriteStream(filePath));
  }

  private guessExtension(url: string): string {
    const match = url.split('?')[0].match(/\.(webp|jpg|jpeg|png|gif)$/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }
}
