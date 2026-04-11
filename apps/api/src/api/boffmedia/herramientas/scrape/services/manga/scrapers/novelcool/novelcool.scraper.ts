// ---------------------------------------------------------------------------
// NovelCool scraper — implements IMangaScraper for es.novelcool.com.
//
// Chapter images are rendered by JavaScript, so Playwright is required.
// Search results and chapter lists are fetched via Axios with realistic
// browser headers. If the plain request is blocked, a proxy retry is
// attempted using the MANGA_SCRAPER_PROXY env var.
// ---------------------------------------------------------------------------

import { BrowserContext } from 'playwright';
import * as cheerio from 'cheerio';
import { IMangaScraper } from '../manga-scraper.interface';
import { MangaChapter, MangaSearchResult } from '../../manga.types';
import { normalizeChapterNumber } from '../../chapter-normalizer';
import { fetchHtmlSafe, MAX_RETRIES, randomDelay, sleep, UA } from '../../manga-http';
import { MangaBrowserService } from '../../manga-browser.service';

export class NovelCoolScraper implements IMangaScraper {
  readonly name = 'novelcool-es';
  readonly requiresBrowser = true;

  constructor(private readonly browserService: MangaBrowserService) {}

  // ── Routing ───────────────────────────────────────────────────────────────

  canHandle(url: string): boolean {
    return url.includes('novelcool.com');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async search(query: string): Promise<MangaSearchResult[]> {
    const html = await this.fetchWithFallback(
      `https://es.novelcool.com/search?name=${encodeURIComponent(query)}`,
    );
    const $ = cheerio.load(html);
    const results: MangaSearchResult[] = [];
    const seen = new Set<string>();

    $('[class*="book-item"]').each((_, el) => {
      const url = $(el).find('a[href*="/novel/"]').first().attr('href') ?? '';
      if (!url || seen.has(url)) return;
      seen.add(url);

      const title =
        $(el).find('.book-pic').attr('title') ??
        $(el).find('a[href*="/novel/"]').first().attr('title') ??
        '';
      const cover =
        $(el).find('img[cover_url]').attr('cover_url') ??
        $(el).find('img').first().attr('src') ??
        '';

      results.push({ title: title.trim(), url, cover });
    });

    return results;
  }

  async getTitle(novelUrl: string): Promise<string> {
    const html = await this.fetchWithFallback(novelUrl);
    const $ = cheerio.load(html);
    return $('h1').first().text().trim();
  }

  async getChapterList(novelUrl: string): Promise<MangaChapter[]> {
    const html = await this.fetchWithFallback(novelUrl);
    const $ = cheerio.load(html);
    const chapters: MangaChapter[] = [];
    const seen = new Set<string>();

    $('a[href*="/chapter/"]').each((_, el) => {
      const url = $(el).attr('href') ?? '';
      const rawText = $(el).text().trim().split('\n')[0].trim();

      if (!url || seen.has(url) || rawText === 'Empieza a leer') return;
      seen.add(url);

      chapters.push({
        title: rawText,
        url,
        number: normalizeChapterNumber(rawText),
      });
    });

    // HTML lists chapters newest-first; reverse so oldest chapter is index 0.
    chapters.reverse();
    return chapters;
  }

  async getChapterImages(chapterUrl: string, context: BrowserContext): Promise<string[]> {
    const firstPageUrl = this.normalizeChapterUrl(chapterUrl);
    const totalPages = await this.detectTotalPages(context, firstPageUrl);

    // Strip any existing page suffix to get the canonical base URL.
    const canonicalBase = chapterUrl
      .replace(/-10-\d+\.html$/, '')
      .replace(/\/?$/, '');

    const allImages: string[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const pageUrl = this.buildPageUrl(canonicalBase, page);
      const images = await this.scrapePageWithRetry(context, pageUrl, page);
      allImages.push(...images);
      if (page < totalPages) await randomDelay();
    }

    // Deduplicate while preserving order.
    return [...new Set(allImages)];
  }

  // ── Private: HTTP fallback chain ──────────────────────────────────────────

  /**
   * Tries to fetch the URL with realistic browser headers.
   * Falls back to a proxy if MANGA_SCRAPER_PROXY is set and the plain
   * request is blocked (returns null from fetchHtmlSafe).
   * Throws if all attempts fail.
   */
  private async fetchWithFallback(url: string): Promise<string> {
    // 1. Plain Axios with realistic headers.
    const direct = await fetchHtmlSafe(url);
    if (direct !== null) return direct;

    console.warn(`[NovelCoolScraper] Direct fetch blocked for ${url}`);

    // 2. Proxy retry if configured.
    const proxyUrl = process.env.MANGA_SCRAPER_PROXY;
    if (proxyUrl) {
      console.warn(`[NovelCoolScraper] Retrying via proxy: ${proxyUrl}`);
      const proxied = await fetchHtmlSafe(url, proxyUrl);
      if (proxied !== null) return proxied;
      console.warn(`[NovelCoolScraper] Proxy fetch also blocked for ${url}`);
    }

    // 3. Playwright fallback — real browser bypasses IP-based blocks.
    console.warn(`[NovelCoolScraper] Falling back to Playwright for ${url}`);
    return this.fetchHtmlWithPlaywright(url);
  }

  private async fetchHtmlWithPlaywright(url: string): Promise<string> {
    const browser = await this.browserService.getBrowser();
    const context = await browser.newContext({ userAgent: UA });
    const page = await context.newPage();

    // Hide headless signals that novelcool uses for bot detection.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Wait for actual content: book items on search pages, chapter links on
      // novel pages, or h1 on any page — whichever appears first.
      await page
        .waitForSelector('[class*="book-item"], a[href*="/chapter/"], h1', {
          timeout: 15_000,
        })
        .catch(() => { /* timeout fine — return whatever loaded */ });

      return await page.content();
    } finally {
      await page.close();
      await context.close();
    }
  }

  // ── Private: URL helpers ──────────────────────────────────────────────────

  private normalizeChapterUrl(url: string): string {
    if (url.endsWith('.html')) return url;
    return url.replace(/\/?$/, '-10-1.html');
  }

  private buildPageUrl(base: string, page: number): string {
    return `${base.replace(/-10-\d+\.html$/, '')}-10-${page}.html`;
  }

  // ── Private: Playwright page scraping ─────────────────────────────────────

  /**
   * Reads the first `select.sl-page` option count to determine how many
   * image-pages exist in this chapter. Uses $eval (not $$eval) so that the
   * duplicate footer select element is ignored.
   */
  private async detectTotalPages(
    context: BrowserContext,
    firstPageUrl: string,
  ): Promise<number> {
    const page = await context.newPage();
    try {
      await page.goto(firstPageUrl, { waitUntil: 'domcontentloaded' });
      const count = await page
        .$eval('select.sl-page', el => el.querySelectorAll('option').length)
        .catch(() => 0);
      return count > 0 ? count : 1;
    } finally {
      await page.close();
    }
  }

  private async scrapePageWithRetry(
    context: BrowserContext,
    pageUrl: string,
    pageNum: number,
  ): Promise<string[]> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        return await this.scrapeSinglePage(context, pageUrl);
      } catch (err) {
        lastError = err as Error;
        if (attempt <= MAX_RETRIES) {
          console.warn(
            `[NovelCoolScraper] Page ${pageNum} attempt ${attempt} failed — retrying… (${lastError.message})`,
          );
          await sleep(1000 * attempt);
        }
      }
    }

    console.error(
      `[NovelCoolScraper] Page ${pageNum} failed after ${MAX_RETRIES} retries: ${lastError?.message}`,
    );
    return [];
  }

  private async scrapeSinglePage(
    context: BrowserContext,
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
