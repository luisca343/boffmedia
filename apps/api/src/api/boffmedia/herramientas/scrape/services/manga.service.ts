import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';

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

  async scrapeChapter(chapterUrl: string): Promise<string[]> {
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

      // Use $eval on the FIRST select.sl-page only — $$eval would sum options
      // across all matching selects (header + footer = double count)
      const optionCount = await page.$eval(
        'select.sl-page',
        select => select.querySelectorAll('option').length,
      ).catch(() => 0);

      if (optionCount > 0) return optionCount;

      return 1;
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
}
