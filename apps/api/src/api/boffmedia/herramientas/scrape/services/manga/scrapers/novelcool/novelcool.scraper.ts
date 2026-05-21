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
import {
  fetchHtmlSafe,
  getProxies,
  toPlaywrightProxy,
  MAX_RETRIES,
  randomDelay,
  sleep,
  UA,
} from '../../manga-http';
import { MangaBrowserService } from '../../manga-browser.service';
import pino from 'pino';

const logger = pino({ name: 'util' });

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

      if (!url || !rawText || seen.has(url) || rawText === 'Empieza a leer')
        return;
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

  async getChapterImages(
    chapterUrl: string,
    context: BrowserContext,
  ): Promise<string[]> {
    const firstPageUrl = this.normalizeChapterUrl(chapterUrl);
    logger.info(
      `[NovelCoolScraper] Detecting total pages for chapter: ${firstPageUrl}`,
    );
    const totalPages = await this.detectTotalPages(context, firstPageUrl);
    logger.info(`[NovelCoolScraper] Chapter has ${totalPages} page(s)`);

    // Strip any existing page suffix to get the canonical base URL.
    const canonicalBase = chapterUrl
      .replace(/-10-\d+\.html$/, '')
      .replace(/\/?$/, '');

    const allImages: string[] = [];

    for (let page = 1; page <= totalPages; page++) {
      const pageUrl = this.buildPageUrl(canonicalBase, page);
      logger.info(
        `[NovelCoolScraper] Scraping page ${page}/${totalPages}: ${pageUrl}`,
      );
      const images = await this.scrapePageWithRetry(context, pageUrl, page);
      logger.info(
        `[NovelCoolScraper] Page ${page}/${totalPages}: found ${images.length} image(s)`,
      );
      allImages.push(...images);
      if (page < totalPages) await randomDelay();
    }

    const deduplicated = [...new Set(allImages)];
    logger.info(
      `[NovelCoolScraper] Chapter done — ${deduplicated.length} unique image(s) total`,
    );
    return deduplicated;
  }

  // ── Private: HTTP fallback chain ──────────────────────────────────────────

  /**
   * Three-tier fetch chain:
   *   1. Plain Axios (no proxy) — fastest, works when server allows direct access.
   *   2. Proxy pool (up to 3 random proxies) — if direct is blocked.
   *   3. Playwright + proxy — last resort for JS-rendered or heavily guarded pages.
   * Throws if all tiers fail.
   */
  private async fetchWithFallback(url: string): Promise<string> {
    // 1. Direct — no proxy.
    logger.info(`[NovelCoolScraper] Fetching (direct): ${url}`);
    const direct = await fetchHtmlSafe(url);
    if (direct !== null) {
      logger.info(`[NovelCoolScraper] Direct fetch succeeded for ${url}`);
      return direct;
    }
    logger.warn(
      `[NovelCoolScraper] Direct fetch blocked — trying proxies for ${url}`,
    );

    // 2. Proxy pool — only when tunnel is enabled.
    const tunnelEnabled = this.browserService.getTunnelEnabled();
    const proxies = tunnelEnabled ? await getProxies(3) : [];
    if (!tunnelEnabled) {
      logger.info(
        `[NovelCoolScraper] Tunnel disabled — skipping proxy tier for ${url}`,
      );
    } else if (proxies.length === 0) {
      logger.warn(
        `[NovelCoolScraper] Tunnel enabled but no proxies configured — skipping proxy tier`,
      );
    }
    for (let i = 0; i < proxies.length; i++) {
      logger.info(
        `[NovelCoolScraper] Proxy attempt ${i + 1}/${proxies.length} for ${url}`,
      );
      const proxied = await fetchHtmlSafe(url, proxies[i]);
      if (proxied !== null) {
        logger.info(`[NovelCoolScraper] Proxy ${i + 1} succeeded for ${url}`);
        return proxied;
      }
      logger.warn(`[NovelCoolScraper] Proxy ${i + 1} blocked for ${url}`);
    }

    // 3. Playwright fallback — use proxy only when tunnel is enabled.
    const fallbackProxy = tunnelEnabled ? proxies[0] : undefined;
    logger.warn(
      `[NovelCoolScraper] All HTTP attempts failed — falling back to Playwright${fallbackProxy ? ' (with proxy)' : ' (direct)'} for ${url}`,
    );
    return this.fetchHtmlWithPlaywright(url, fallbackProxy);
  }

  private async fetchHtmlWithPlaywright(
    url: string,
    proxyUrl?: string,
  ): Promise<string> {
    logger.info(
      `[NovelCoolScraper] Launching Playwright for ${url}${proxyUrl ? ' (with proxy)' : ' (no proxy)'}`,
    );
    const browser = await this.browserService.getBrowser();
    const context = await browser.newContext({
      userAgent: UA,
      ...(proxyUrl ? { proxy: toPlaywrightProxy(proxyUrl) } : {}),
    });
    const page = await context.newPage();

    // Hide headless signals that novelcool uses for bot detection.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
      logger.info(`[NovelCoolScraper] Playwright navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Dismiss age/content warning if present (e.g. violence/adult content gate).
      const warned = await page
        .locator('.bookwarn-continue')
        .click()
        .then(() => true)
        .catch(() => false);
      if (warned)
        logger.info(`[NovelCoolScraper] Dismissed content warning on ${url}`);

      await page
        .waitForSelector('[class*="book-item"], a[href*="/chapter/"], h1', {
          timeout: 15_000,
        })
        .catch(() => {});
      logger.info(`[NovelCoolScraper] Playwright page loaded for ${url}`);
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
        .$eval('select.sl-page', (el) => el.querySelectorAll('option').length)
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
      } catch (err: unknown) {
        lastError = err as Error;
        if (attempt <= MAX_RETRIES) {
          logger.warn(
            `[NovelCoolScraper] Page ${pageNum} attempt ${attempt} failed — retrying… (${lastError.message})`,
          );
          await sleep(1000 * attempt);
        }
      }
    }

    logger.error(
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
      return await page.$$eval('.mangaread-manga-pic', (imgs) =>
        imgs
          .map((img) => (img as HTMLImageElement).src)
          .filter((src) => !!src && src.startsWith('http')),
      );
    } finally {
      await page.close();
    }
  }
}
