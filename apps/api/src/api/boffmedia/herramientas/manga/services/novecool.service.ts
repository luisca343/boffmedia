import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { chromium, Browser } from 'playwright';
import { MangaResult } from '../entities/manga-result.entity';
import { MangaChapter, MangaDetail } from '../entities/manga-chapter.entity';

// ---------------------------------------------------------------------------
// Novecool scraper
//
// Base URL: https://es.novelcool.com
// Search:   https://es.novelcool.com/search/?wd={query}
// Detail:   https://es.novelcool.com/novel/{slug}.html
// Chapter:  https://es.novelcool.com/chapter/{slug}/{chap-number}/
//           (or the full URL found in the chapter list anchor href)
//
// If the site's HTML structure changes, update the selector constants below.
// ---------------------------------------------------------------------------

const BASE_URL = 'https://es.novelcool.com';
const SOURCE_NAME = 'Novecool';

// ── Search result selectors ─────────────────────────────────────────────────
const SEL_BOOK_ITEM = '.book-item'; // each search result card
const SEL_BOOK_LINK = 'a'; // first anchor in the card (detail link)
const SEL_BOOK_TITLE = '.book-name, .title, h4, .novel-title'; // title text
const SEL_BOOK_COVER = 'img'; // cover image
const SEL_BOOK_TAGS = '.tag-item, .genre-item, .categories a'; // tag badges

// ── Detail page selectors ───────────────────────────────────────────────────
const SEL_DETAIL_TITLE = 'h1, .book-name, .novel-title';
const SEL_DETAIL_COVER = '.book-pic img, .novel-cover img, .book-cover img';
const SEL_DETAIL_TAGS = '.tag-item, .genre-item, .tag-links a, .categories a';
// Each chapter is a .chp-item; the <a> holds the href and the title attribute;
// the visible text is in span.chapter-item-headtitle.
const SEL_CHAPTER_ITEM = '.chp-item';
const SEL_CHAPTER_LINK = 'a';
const SEL_CHAPTER_TITLE = 'span.chapter-item-headtitle';

// ── Chapter image selectors ─────────────────────────────────────────────────
// Novelcool typically uses lazy-loaded images; check data-src first then src.
const _SEL_CHAPTER_IMAGES =
  '.chapter-img, .reading-content img, .manga-images img, #chapter-images img, .page-img';

// ---------------------------------------------------------------------------
// Headers sent for every HTML page request.
// undici (Node 18 global fetch) adds Accept-Encoding automatically, so we
// omit it here to avoid duplicates.  Connection is HTTP/1.1-only; HTTP/2
// (which undici negotiates via ALPN) doesn't use it.
// ---------------------------------------------------------------------------
const HTML_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Sec-Ch-Ua':
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
};

// Separate, minimal headers for binary image downloads (axios, stays HTTP/1.1).
const IMAGE_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

/** Resolves a potentially relative URL against the base. */
function resolveUrl(href: string): string {
  if (!href) return '';
  if (href.startsWith('http')) return href;
  return new URL(href, BASE_URL).href;
}

/** Extracts the image URL from an element, preferring data-src over src (lazy-load). */
function extractImageSrc($el: {
  attr(name: string): string | undefined;
}): string {
  return (
    $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('src') || ''
  );
}

@Injectable()
export class NovecoolService implements OnModuleDestroy {
  private readonly logger = new Logger(NovecoolService.name);

  /** Lazily-initialised Playwright Chromium instance (reused across chapter downloads). */
  private browser: Browser | null = null;

  constructor() {
    this.logger.log(
      '[Novecool] Service initialised — chapter pages use Playwright Chromium',
    );
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    this.logger.log('[Novecool] Launching Playwright Chromium…');
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
        ...(process.env.CHROME_PATH
          ? { executablePath: process.env.CHROME_PATH }
          : {}),
      });
    } catch (e) {
      this.logger.error(
        `[Novecool] Browser launch failed: ${(e as Error)?.message ?? e}`,
      );
      throw e;
    }
    this.logger.log('[Novecool] Playwright Chromium launched');
    return this.browser;
  }

  /**
   * Simple in-process cookie jar (used by search + detail fetches via fetch()).
   */
  private cookieJar: Map<string, string> = new Map();

  private cookieHeader(): string {
    return [...this.cookieJar.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private captureCookies(setCookieHeader: string | string[] | undefined): void {
    if (!setCookieHeader) return;
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader];
    for (const raw of cookies) {
      const nameValue = raw.split(';')[0].trim();
      const eqIdx = nameValue.indexOf('=');
      if (eqIdx > 0) {
        this.cookieJar.set(
          nameValue.slice(0, eqIdx),
          nameValue.slice(eqIdx + 1),
        );
      }
    }
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async search(query: string): Promise<MangaResult[]> {
    const url = `${BASE_URL}/search/?wd=${encodeURIComponent(query)}`;
    this.logger.log(`[Novecool] Searching: ${url}`);

    const html = await this.fetchHtml(url);
    const $ = cheerio.load(html);
    const results: MangaResult[] = [];

    $(SEL_BOOK_ITEM).each((_i, el) => {
      const $el = $(el);

      // Link to detail page
      const href = $el.find(SEL_BOOK_LINK).first().attr('href') ?? '';
      const detailUrl = resolveUrl(href);
      if (!detailUrl) return;

      // Title — try dedicated selector, fall back to link title/alt
      let title = $el.find(SEL_BOOK_TITLE).first().text().trim();
      if (!title) title = $el.find('a').first().attr('title')?.trim() ?? '';
      if (!title) title = $el.find('img').first().attr('alt')?.trim() ?? '';
      if (!title) return; // skip entries without a title

      // Cover
      const coverUrl = resolveUrl(
        extractImageSrc($el.find(SEL_BOOK_COVER).first()),
      );

      // Tags
      const tags: string[] = [];
      $el.find(SEL_BOOK_TAGS).each((_j, tag) => {
        const t = $(tag).text().trim();
        if (t) tags.push(t);
      });

      results.push({
        title,
        url: detailUrl,
        source: SOURCE_NAME,
        coverUrl,
        tags,
      });
    });

    this.logger.log(
      `[Novecool] Found ${results.length} result(s) for "${query}"`,
    );
    return results;
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  async getDetail(mangaUrl: string): Promise<MangaDetail> {
    this.logger.log(`[Novecool] Loading detail: ${mangaUrl}`);

    const html = await this.fetchHtml(mangaUrl);
    const $ = cheerio.load(html);

    // Title
    const title = $(SEL_DETAIL_TITLE).first().text().trim() || 'Unknown Title';

    // Cover
    const coverUrl = resolveUrl(extractImageSrc($(SEL_DETAIL_COVER).first()));

    // Tags
    const tags: string[] = [];
    $(SEL_DETAIL_TAGS).each((_i, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });

    // Chapters — collected in DOM order (usually newest-first on novelcool)
    const chapters: MangaChapter[] = [];
    $(SEL_CHAPTER_ITEM).each((_i, el) => {
      const $el = $(el);
      const href = $el.find(SEL_CHAPTER_LINK).first().attr('href') ?? '';
      const chapterUrl = resolveUrl(href);
      if (!chapterUrl) return;

      const rawTitle =
        $el.find(SEL_CHAPTER_TITLE).first().text().trim() ||
        $el.find(SEL_CHAPTER_LINK).first().attr('title')?.trim() ||
        '';
      if (!rawTitle) return;

      // Try to extract a chapter number from the title
      const numMatch = rawTitle.match(/[\d]+(?:\.\d+)?/);
      const number = numMatch ? numMatch[0] : String(_i + 1);

      chapters.push({ title: rawTitle, url: chapterUrl, number });
    });

    this.logger.log(
      `[Novecool] Found ${chapters.length} chapter(s) for "${title}"`,
    );

    return {
      title,
      url: mangaUrl,
      source: SOURCE_NAME,
      coverUrl,
      tags,
      chapters,
      chapterCount: chapters.length,
    };
  }

  // ── Chapter images ────────────────────────────────────────────────────────

  /**
   * Fetches ALL image URLs for a Novelcool chapter.
   *
   * Novelcool serves chapters one image per page (e.g. 6953949-1.html … 6953949-14.html),
   * but also supports a "load N images" mode via URLs like 6953949-10-1.html.
   * We use the 10-images-per-page variant to minimise HTTP requests.
   *
   * @param chapterUrl  The chapter URL from the manga detail page (may end with "/")
   * @param mangaUrl    The manga detail page URL – used as Referer to avoid 403s
   */
  async getChapterImageUrls(
    chapterUrl: string,
    mangaUrl?: string,
  ): Promise<string[]> {
    const base = chapterUrl.replace(/\/+$/, '');
    const IMGS_PER_PAGE = 10;
    const allImages: string[] = [];

    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: HTML_HEADERS['User-Agent'],
      extraHTTPHeaders: { Referer: mangaUrl ?? BASE_URL },
    });
    const tab = await context.newPage();

    try {
      let page = 1;
      while (true) {
        const url = `${base}-${IMGS_PER_PAGE}-${page}.html`;
        this.logger.log(
          `[Novecool] Fetching chapter page ${page} via Playwright: ${url}`,
        );

        await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

        // Extract all manga page image sources directly from the live DOM
        const pageImages: string[] = await tab.evaluate(() =>
          Array.from(document.querySelectorAll('img.mangaread-manga-pic'))
            .map((img) => (img as HTMLImageElement).src)
            .filter((src) => Boolean(src)),
        );

        allImages.push(...pageImages);
        this.logger.log(
          `[Novecool] Page ${page}: ${pageImages.length} image(s)`,
        );

        if (pageImages.length < IMGS_PER_PAGE) break;
        page++;
      }
    } finally {
      await tab.close();
      await context.close();
    }

    this.logger.log(
      `[Novecool] Total: ${allImages.length} image(s) in chapter`,
    );
    return allImages;
  }

  /**
   * Downloads a single image from a URL and returns its raw Buffer.
   * Retries once on failure.
   */
  async downloadImage(imageUrl: string, referer?: string): Promise<Buffer> {
    const config: AxiosRequestConfig = {
      responseType: 'arraybuffer',
      headers: {
        ...IMAGE_HEADERS,
        ...(referer ? { Referer: referer } : {}),
      },
      timeout: 20_000,
      maxRedirects: 5,
    };

    try {
      const { data } = await axios.get<Buffer>(imageUrl, config);
      return Buffer.from(data);
    } catch {
      this.logger.warn(`[Novecool] Retrying image: ${imageUrl}`);
      try {
        const { data } = await axios.get<Buffer>(imageUrl, config);
        return Buffer.from(data);
      } catch (secondErr) {
        throw new Error(
          `Failed to download image ${imageUrl}: ${secondErr?.message ?? secondErr}`,
        );
      }
    }
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  /**
   * Fetches an HTML page using Node 18's global fetch (backed by undici).
   * Unlike axios, undici negotiates HTTP/2 via ALPN, which passes the browser
   * fingerprint check that Novelcool applies on chapter pages.
   */
  private async fetchHtml(
    url: string,
    extraHeaders?: Record<string, string>,
  ): Promise<string> {
    const cookieStr = this.cookieHeader();
    const headers: Record<string, string> = {
      ...HTML_HEADERS,
      ...(cookieStr ? { Cookie: cookieStr } : {}),
      ...(extraHeaders ?? {}),
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    // Capture Set-Cookie for the session jar.
    // Node 20 exposes getSetCookie(); Node 18 returns a combined string from get().
    const rawCookies: string[] =
      typeof (response.headers as any).getSetCookie === 'function'
        ? (response.headers as any).getSetCookie()
        : (response.headers.get('set-cookie') ?? '').split(',').filter(Boolean);
    this.captureCookies(rawCookies);

    return response.text();
  }
}
