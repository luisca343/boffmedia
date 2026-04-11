// ---------------------------------------------------------------------------
// NovelCool scraper — implements IMangaScraper for es.novelcool.com.
//
// ALL page operations use Playwright (not axios/cheerio) so the server is
// indistinguishable from a real browser. This is required because novelcool
// detects and blocks plain HTTP requests from server IPs, returning empty or
// completely different HTML than what a browser receives.
// ---------------------------------------------------------------------------

import { BrowserContext } from 'playwright';
import { IMangaScraper } from '../manga-scraper.interface';
import { MangaChapter, MangaSearchResult } from '../../manga.types';
import { normalizeChapterNumber } from '../../chapter-normalizer';
import { MAX_RETRIES, sleep } from '../../manga-http';

export class NovelCoolScraper implements IMangaScraper {
  readonly name = 'novelcool-es';
  readonly requiresBrowser = true;

  // ── Routing ───────────────────────────────────────────────────────────────

  canHandle(url: string): boolean {
    return url.includes('novelcool.com');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async search(query: string, context: BrowserContext): Promise<MangaSearchResult[]> {
    const page = await context.newPage();
    try {
      await page.goto(
        `https://es.novelcool.com/search?name=${encodeURIComponent(query)}`,
        { waitUntil: 'domcontentloaded' },
      );

      // $$eval runs inside the browser — extract plain data only.
      const raw = await page.$$eval('[class*="book-item"]', els =>
        els.map(el => {
          const link = el.querySelector('a[href*="/novel/"]') as HTMLAnchorElement | null;
          const bookPic = el.querySelector('.book-pic') as HTMLElement | null;
          const img = el.querySelector('img') as HTMLImageElement | null;
          return {
            url: link?.href ?? '',
            title: (bookPic?.getAttribute('title') ?? link?.getAttribute('title') ?? '').trim(),
            cover: img?.getAttribute('cover_url') ?? img?.src ?? '',
          };
        }),
      );

      // Deduplicate by URL (Node-side, avoids serialising Sets into browser).
      const seen = new Set<string>();
      return raw.filter(r => {
        if (!r.url || seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });
    } finally {
      await page.close();
    }
  }

  async getTitle(novelUrl: string, context: BrowserContext): Promise<string> {
    const page = await context.newPage();
    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded' });
      return await page
        .$eval('h1', el => el.textContent?.trim() ?? '')
        .catch(() => '');
    } finally {
      await page.close();
    }
  }

  async getChapterList(novelUrl: string, context: BrowserContext): Promise<MangaChapter[]> {
    const page = await context.newPage();
    try {
      await page.goto(novelUrl, { waitUntil: 'domcontentloaded' });

      // Extract title + URL pairs in the browser; chapter number normalisation
      // happens in Node so we don't need to serialise the regex.
      const raw = await page.$$eval('a[href*="/chapter/"]', els =>
        els.map(el => {
          const a = el as HTMLAnchorElement;
          return {
            url: a.href,
            title: (a.textContent?.trim().split('\n')[0].trim() ?? ''),
          };
        }),
      );

      const seen = new Set<string>();
      const chapters: MangaChapter[] = [];

      for (const { url, title } of raw) {
        if (!url || seen.has(url) || title === 'Empieza a leer') continue;
        seen.add(url);
        chapters.push({ title, url, number: normalizeChapterNumber(title) });
      }

      // HTML lists chapters newest-first; reverse so oldest is index 0.
      chapters.reverse();
      return chapters;
    } finally {
      await page.close();
    }
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
      if (page < totalPages) await sleep(400);
    }

    // Deduplicate while preserving order.
    return [...new Set(allImages)];
  }

  // ── Private: URL helpers ──────────────────────────────────────────────────

  private normalizeChapterUrl(url: string): string {
    if (url.endsWith('.html')) return url;
    return url.replace(/\/?$/, '-10-1.html');
  }

  private buildPageUrl(base: string, page: number): string {
    return `${base.replace(/-10-\d+\.html$/, '')}-10-${page}.html`;
  }

  // ── Private: Playwright chapter image scraping ────────────────────────────

  /**
   * Reads the first `select.sl-page` option count to determine how many
   * image-pages this chapter has. Uses $eval (not $$eval) so the duplicate
   * footer select is ignored.
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
