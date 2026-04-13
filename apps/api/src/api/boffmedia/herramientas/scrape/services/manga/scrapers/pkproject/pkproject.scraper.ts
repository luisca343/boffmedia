// ---------------------------------------------------------------------------
// PkProjectScraper — scrapes manga from pkproject.net
//
// URL structure:
//   Sagas index  : https://pkproject.net/manga/{series}/sagas
//   Volume page  : https://pkproject.net/manga/{series}/{saga}/tomo-{n}
//   Chapter page : https://pkproject.net/manga/{series}/{saga}/tomo-{n}/capitulo-{n}
//
// The site serves fully-rendered HTML — no Playwright needed.
// ---------------------------------------------------------------------------

import * as cheerio from 'cheerio';
import { BrowserContext } from 'playwright';
import { IMangaScraper } from '../manga-scraper.interface';
import { MangaChapter, MangaSearchResult } from '../../manga.types';
import { fetchHtmlSafe, UA } from '../../manga-http';
import { normalizeChapterNumber } from '../../chapter-normalizer';

const BASE = 'https://pkproject.net';

// Derive the sagas index URL from a volume or chapter URL.
// e.g. https://pkproject.net/manga/pokemon-adventures/saga-rojo-verde-y-azul/tomo-1
//   →  https://pkproject.net/manga/pokemon-adventures/sagas
function sagasUrl(url: string): string {
  const match = url.match(/^(https?:\/\/pkproject\.net\/manga\/[^/]+)/);
  if (!match) throw new Error(`Cannot derive sagas URL from: ${url}`);
  return `${match[1]}/sagas`;
}

// Normalise a potentially relative URL (removes leading "./" if present).
function normalizeImgUrl(src: string): string {
  if (src.startsWith('http')) return src;
  return src.startsWith('./') ? `${BASE}/${src.slice(2)}` : `${BASE}${src}`;
}

export class PkProjectScraper implements IMangaScraper {
  readonly name = 'pkproject';
  readonly requiresBrowser = false;

  // Cache the volume list per sagas-page URL so we don't re-fetch on every call.
  private readonly volumeCache = new Map<string, MangaSearchResult[]>();

  canHandle(url: string): boolean {
    return url.includes('pkproject.net/manga/');
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /**
   * Loads the series' sagas index page and returns volumes that match the query.
   * Accepts both full pkproject.net tomo URLs and plain text queries like
   * "pokemon adventures rojo". When a plain query is used we fetch the default
   * Pokémon Adventures sagas page.
   */
  async search(query: string): Promise<MangaSearchResult[]> {
    const lower = query.toLowerCase();

    // If the user pasted a URL, derive the sagas page from it.
    const pageUrl = query.startsWith('http') && query.includes('pkproject.net')
      ? sagasUrl(query)
      : `${BASE}/manga/pokemon-adventures/sagas`;

    const volumes = await this.loadVolumes(pageUrl);

    if (!lower.trim()) return volumes;
    return volumes.filter(t => t.title.toLowerCase().includes(lower));
  }

  // ── Title ─────────────────────────────────────────────────────────────────

  async getTitle(novelUrl: string): Promise<string> {
    const pageUrl = sagasUrl(novelUrl);
    const volumes = await this.loadVolumes(pageUrl);
    const match = volumes.find(t => t.url === novelUrl || novelUrl.startsWith(t.url));
    if (match) return match.title;

    // Fallback: derive from URL segments.
    return this.titleFromUrl(novelUrl);
  }

  // ── Chapter list ──────────────────────────────────────────────────────────

  async getChapterList(novelUrl: string): Promise<MangaChapter[]> {
    // Accept both tomo URLs and chapter URLs — strip to tomo level.
    const tomoUrl = this.toVolumeUrl(novelUrl);

    const html = await fetchHtmlSafe(tomoUrl);
    if (!html) throw new Error(`[pkproject] Failed to fetch tomo page: ${tomoUrl}`);

    const $ = cheerio.load(html);
    const chapters: MangaChapter[] = [];

    $('.manga_ch_list a').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (!href || !title) return;
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      const number = normalizeChapterNumber(title);
      chapters.push({ title, url, number });
    });

    // The page lists chapters top-to-bottom (oldest first) — preserve that order.
    return chapters;
  }

  // ── Chapter images ────────────────────────────────────────────────────────

  async getChapterImages(chapterUrl: string, _context: BrowserContext): Promise<string[]> {
    const html = await fetchHtmlSafe(chapterUrl);
    if (!html) throw new Error(`[pkproject] Failed to fetch chapter: ${chapterUrl}`);

    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const images: string[] = [];

    $('div.blurred-img img.spotlight').each((_, el) => {
      const raw = $(el).attr('src') ?? '';
      if (!raw || raw.includes('/img/site/')) return; // skip nav/UI images
      const canonical = normalizeImgUrl(raw).replace(/\/\.\//g, '/');
      if (!seen.has(canonical)) {
        seen.add(canonical);
        images.push(canonical);
      }
    });

    return images;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Fetch and cache the list of all volumes from the given sagas-index URL.
   * Each `<a>` inside a `.grid` block (one per saga) has the volume URL and
   * an `aria-label` like "Pokémon Adventures - Saga Rojo, Verde y Azul - Tomo 1".
   */
  private async loadVolumes(pageUrl: string): Promise<MangaSearchResult[]> {
    if (this.volumeCache.has(pageUrl)) return this.volumeCache.get(pageUrl)!;

    const html = await fetchHtmlSafe(pageUrl);
    if (!html) {
      console.warn(`[pkproject] Could not load sagas page: ${pageUrl}`);
      return [];
    }

    const $ = cheerio.load(html);
    const volumes: MangaSearchResult[] = [];

    // Each saga section: <h2>Saga ...</h2><div class="grid"><a href="...tomo-N" ...>
    $('div.grid a[href*="/tomo-"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const label = $(el).attr('aria-label') ?? '';
      // Cover image: inside the <a> there's an <img> with a CDN-resized src.
      const rawCover = $(el).find('img').attr('src') ?? '';
      // Unwrap CDN resize prefix to get the real image URL.
      const cover = rawCover.replace(/^https:\/\/pkproject\.net\/cdn-cgi\/image\/[^/]+\//, '');

      if (!href || !label) return;
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      volumes.push({ title: label, url, cover });
    });

    this.volumeCache.set(pageUrl, volumes);
    return volumes;
  }

  /** Strip a chapter URL back down to volume level if needed. */
  private toVolumeUrl(url: string): string {
    const match = url.match(/^(https?:\/\/pkproject\.net\/manga\/[^/]+\/[^/]+\/tomo-\d+)/);
    return match ? match[1] : url;
  }

  /** Last-resort title from URL segments. */
  private titleFromUrl(url: string): string {
    const parts = url.replace(/^https?:\/\/pkproject\.net\/manga\//, '').split('/');
    return parts
      .map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .join(' - ');
  }
}
