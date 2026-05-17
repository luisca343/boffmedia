// ---------------------------------------------------------------------------
// LeerCapituloScraper — scrapes manga from leercapitulo.co
//
// URL hierarchy:
//   Manga page  : https://www.leercapitulo.co/manga/{id}/{slug}/
//   Chapter URL : https://www.leercapitulo.co/leer/{id}/{slug}/{num}/
//
// Search is not implemented — use a direct manga page URL.
//
// Chapter images require Playwright: we select "Vista: Todo en uno" (value="1")
// from the loadImgType select, then collect all <a[data-page] img> data-src URLs.
// ---------------------------------------------------------------------------

import * as cheerio from 'cheerio';
import { BrowserContext } from 'playwright';
import { IMangaScraper } from '../manga-scraper.interface';
import { MangaChapter, MangaSearchResult } from '../../manga.types';
import { fetchHtmlSafe } from '../../manga-http';
import { normalizeChapterNumber } from '../../chapter-normalizer';
import { MangaBrowserService } from '../../manga-browser.service';
import pino from 'pino';

const logger = pino({ name: 'util' });

const BASE = 'https://www.leercapitulo.co';

export class LeerCapituloScraper implements IMangaScraper {
  readonly name = 'leercapitulo';
  readonly requiresBrowser = true;

  constructor(private readonly browserService: MangaBrowserService) {}

  // ── Routing ───────────────────────────────────────────────────────────────

  canHandle(url: string): boolean {
    return url.includes('leercapitulo.co');
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /** Search not implemented — provide a direct manga page URL instead. */
  async search(_query: string): Promise<MangaSearchResult[]> {
    return [];
  }

  // ── Title ─────────────────────────────────────────────────────────────────

  async getTitle(novelUrl: string): Promise<string> {
    const mangaUrl = this.toMangaUrl(novelUrl);
    logger.info(`[LeerCapituloScraper] Fetching title from: ${mangaUrl}`);
    const html = await fetchHtmlSafe(mangaUrl);
    if (!html)
      throw new Error(`[leercapitulo] Failed to fetch manga page: ${mangaUrl}`);

    const $ = cheerio.load(html);
    // Prefer h1; fall back to <title> (strip site suffix if any).
    const h1 = $('h1').first().text().trim();
    if (h1) return h1;
    return $('title').text().trim().split('|')[0].trim();
  }

  // ── Chapter list ──────────────────────────────────────────────────────────

  async getChapterList(novelUrl: string): Promise<MangaChapter[]> {
    const mangaUrl = this.toMangaUrl(novelUrl);
    logger.info(
      `[LeerCapituloScraper] Fetching chapter list from: ${mangaUrl}`,
    );
    const html = await fetchHtmlSafe(mangaUrl);
    if (!html)
      throw new Error(`[leercapitulo] Failed to fetch manga page: ${mangaUrl}`);

    const $ = cheerio.load(html);
    const chapters: MangaChapter[] = [];

    // Selector: .chapter-list ul li .chapter h4 a.xanh
    $('.chapter-list ul li .chapter h4 a.xanh').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = ($(el).attr('title') ?? $(el).text()).trim();
      if (!href || !title) return;
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      chapters.push({ title, url, number: normalizeChapterNumber(title) });
    });

    // Page lists newest-first → reverse so oldest chapter is index 0.
    chapters.reverse();
    logger.info(`[LeerCapituloScraper] Found ${chapters.length} chapter(s)`);
    return chapters;
  }

  // ── Chapter images ────────────────────────────────────────────────────────

  /**
   * Navigates to the chapter page via Playwright, switches to "Vista: Todo en uno"
   * (the view that shows all images at once), then collects every image URL.
   */
  async getChapterImages(
    chapterUrl: string,
    context: BrowserContext,
  ): Promise<string[]> {
    logger.info(`[LeerCapituloScraper] Opening chapter: ${chapterUrl}`);
    const page = await context.newPage();

    try {
      await page.goto(chapterUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      // Switch to "Todo en uno" view so all pages render at once.
      logger.info(`[LeerCapituloScraper] Selecting "Vista: Todo en uno"`);
      await page.selectOption('select[name="number"].loadImgType', '1');

      // Wait for at least one page-image to appear.
      await page.waitForSelector('a[data-page] img', { timeout: 20_000 });

      // Collect image URLs — prefer data-src (lazy-load source), fall back to src.
      const images = await page.$$eval('a[data-page] img', (imgs) =>
        imgs
          .map((img) => {
            const el = img as HTMLImageElement;
            return (
              el.getAttribute('data-src') ||
              el.getAttribute('data-original') ||
              el.src
            );
          })
          .filter((src): src is string => !!src && src.startsWith('http')),
      );

      const deduplicated = [...new Set(images)];
      logger.info(
        `[LeerCapituloScraper] Found ${deduplicated.length} image(s) in chapter`,
      );
      return deduplicated;
    } finally {
      await page.close();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Converts any leercapitulo.co URL to its manga landing page URL.
   *
   * Chapter URL : /leer/{id}/{slug}/{num}/
   * Manga URL   : /manga/{id}/{slug}/
   */
  private toMangaUrl(url: string): string {
    const m = url.match(
      /^(https?:\/\/(?:www\.)?leercapitulo\.co)\/leer\/([^/]+)\/([^/]+)\//,
    );
    if (m) return `${m[1]}/manga/${m[2]}/${m[3]}/`;
    // Already a manga URL or unknown — return as-is.
    return url;
  }
}
