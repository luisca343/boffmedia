// ---------------------------------------------------------------------------
// PkProjectScraper — scrapes manga from pkproject.net
//
// URL hierarchy:
//   Sagas index : https://pkproject.net/manga/{series}/sagas
//   Saga URL    : https://pkproject.net/manga/{series}/{saga}          ← no trailing segment
//   Volume URL  : https://pkproject.net/manga/{series}/{saga}/tomo-{n}
//   Chapter URL : https://pkproject.net/manga/{series}/{saga}/tomo-{n}/capitulo-{n}
//
// Each saga is treated as a single manga entry. Selecting a saga fetches
// chapters from all its volumes in order.
//
// The site serves fully-rendered HTML — no Playwright needed.
// ---------------------------------------------------------------------------

import * as cheerio from 'cheerio';
import { BrowserContext } from 'playwright';
import { IMangaScraper } from '../manga-scraper.interface';
import { MangaChapter, MangaSearchResult } from '../../manga.types';
import { fetchHtmlSafe } from '../../manga-http';
import { normalizeChapterNumber } from '../../chapter-normalizer';

const BASE = 'https://pkproject.net';

// ── Internal types ────────────────────────────────────────────────────────────

interface SagaEntry {
  /** Human-readable name scraped from <h2>, e.g. "Saga Rojo, Verde y Azul" */
  sagaName: string;
  /** Full aria-label from the first tomo, e.g. "Pokémon Adventures - Saga Rojo, Verde y Azul - Tomo 1" */
  fullTitle: string;
  /** Saga-level URL: sagas index URL with the saga slug, e.g. .../saga-rojo-verde-y-azul */
  url: string;
  /** Cover image of the first volume (CDN prefix stripped). */
  cover: string;
  /** All volume URLs under this saga, in order. */
  volumeUrls: string[];
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Derive the sagas-index URL from any pkproject manga URL. */
function sagasIndexUrl(url: string): string {
  const m = url.match(/^(https?:\/\/pkproject\.net\/manga\/[^/]+)/);
  if (!m) throw new Error(`Cannot derive sagas URL from: ${url}`);
  return `${m[1]}/sagas`;
}

/** Derive the saga-level URL (no tomo/capitulo segment) from a volume or chapter URL. */
function toSagaUrl(url: string): string {
  // Strip /tomo-N and /capitulo-N suffixes.
  return url.replace(/\/(tomo-\d+)(\/.*)?$/, '');
}

/** True when the URL ends at the saga level (no tomo/capitulo segment). */
function isSagaUrl(url: string): boolean {
  return /pkproject\.net\/manga\/[^/]+\/[^/]+$/.test(url) && !url.endsWith('/sagas');
}

/** Normalise a potentially relative or CDN-prefixed image URL. */
function normalizeImgUrl(src: string): string {
  // Strip Cloudflare image-resize prefix.
  const stripped = src.replace(/^https:\/\/pkproject\.net\/cdn-cgi\/image\/[^/]+\//, '');
  if (stripped.startsWith('http')) return stripped;
  return stripped.startsWith('./') ? `${BASE}/${stripped.slice(2)}` : `${BASE}${stripped}`;
}

const IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i;

// ── Scraper ───────────────────────────────────────────────────────────────────

export class PkProjectScraper implements IMangaScraper {
  readonly name = 'pkproject';
  readonly requiresBrowser = false;

  /** Cache: sagas-index URL → parsed saga list. */
  private readonly sagaCache = new Map<string, SagaEntry[]>();

  // ── Routing ───────────────────────────────────────────────────────────────

  canHandle(url: string): boolean {
    return url.includes('pkproject.net/manga/');
  }

  // ── Search ────────────────────────────────────────────────────────────────

  /**
   * Returns one result per saga (not per volume).
   * Accepts a plain text query or a full pkproject URL.
   */
  async search(query: string): Promise<MangaSearchResult[]> {
    const indexUrl = query.startsWith('http') && query.includes('pkproject.net')
      ? sagasIndexUrl(query)
      : `${BASE}/manga/pokemon-adventures/sagas`;

    const sagas = await this.loadSagas(indexUrl);
    const lower = query.toLowerCase();

    if (!lower.trim() || query.startsWith('http')) return sagas.map(this.toSearchResult);
    return sagas.filter(s =>
      s.sagaName.toLowerCase().includes(lower) ||
      s.fullTitle.toLowerCase().includes(lower),
    ).map(this.toSearchResult);
  }

  // ── Title ─────────────────────────────────────────────────────────────────

  async getTitle(novelUrl: string): Promise<string> {
    const sagaUrl = toSagaUrl(novelUrl);
    const indexUrl = sagasIndexUrl(novelUrl);
    const sagas = await this.loadSagas(indexUrl);
    const match = sagas.find(s => s.url === sagaUrl);
    // Return the full aria-label title minus the " - Tomo N" suffix.
    if (match) return match.fullTitle.replace(/\s*-\s*Tomo\s*\d+$/i, '').trim();
    return this.titleFromUrl(sagaUrl);
  }

  // ── Chapter list ──────────────────────────────────────────────────────────

  /**
   * When given a saga URL, fetches chapters from ALL volumes in that saga.
   * When given a volume URL directly, fetches only that volume's chapters.
   */
  async getChapterList(novelUrl: string): Promise<MangaChapter[]> {
    const sagaUrl = toSagaUrl(novelUrl);

    if (isSagaUrl(sagaUrl)) {
      return this.getAllChaptersForSaga(sagaUrl);
    }

    // Fallback: treat as a single volume URL.
    return this.getVolumeChapters(novelUrl);
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
      if (!raw || raw.includes('/img/site/')) return;
      const canonical = normalizeImgUrl(raw).replace(/\/\.\//g, '/');
      if (IMAGE_EXTS.test(canonical.split('?')[0]) && !seen.has(canonical)) {
        seen.add(canonical);
        images.push(canonical);
      }
    });

    return images;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Fetch and cache the saga list from a sagas-index page.
   *
   * HTML structure:
   *   <h2>Saga Rojo, Verde y Azul</h2>
   *   <div class="grid">
   *     <a href=".../tomo-1" aria-label="Pokémon Adventures - Saga Rojo, Verde y Azul - Tomo 1">
   *       <img src="...1_1.png">
   *     </a>
   *     <a href=".../tomo-2" ...>...</a>
   *   </div>
   *   <h2>Saga Amarillo</h2>
   *   <div class="grid">...</div>
   */
  private async loadSagas(indexUrl: string): Promise<SagaEntry[]> {
    if (this.sagaCache.has(indexUrl)) return this.sagaCache.get(indexUrl)!;

    const html = await fetchHtmlSafe(indexUrl);
    if (!html) {
      console.warn(`[pkproject] Could not load sagas page: ${indexUrl}`);
      return [];
    }

    const $ = cheerio.load(html);
    const sagas: SagaEntry[] = [];

    $('h2').each((_, h2El) => {
      const sagaName = $(h2El).text().trim();
      if (!sagaName) return;

      const grid = $(h2El).next('div.grid');
      const volumeUrls: string[] = [];
      let cover = '';
      let fullTitle = '';

      grid.find('a[href*="/tomo-"]').each((i, aEl) => {
        const href = $(aEl).attr('href') ?? '';
        if (!href) return;
        const url = href.startsWith('http') ? href : `${BASE}${href}`;
        volumeUrls.push(url);

        if (i === 0) {
          fullTitle = $(aEl).attr('aria-label') ?? sagaName;
          const rawCover = $(aEl).find('img').attr('src') ?? '';
          cover = rawCover ? normalizeImgUrl(rawCover) : '';
        }
      });

      if (volumeUrls.length === 0) return;

      // Derive saga-level URL from the first volume URL (strip /tomo-N).
      const sagaUrl = toSagaUrl(volumeUrls[0]);

      sagas.push({ sagaName, fullTitle, url: sagaUrl, cover, volumeUrls });
    });

    this.sagaCache.set(indexUrl, sagas);
    return sagas;
  }

  /** Fetch chapters from every volume in a saga, in order. */
  private async getAllChaptersForSaga(sagaUrl: string): Promise<MangaChapter[]> {
    const indexUrl = sagasIndexUrl(sagaUrl);
    const sagas = await this.loadSagas(indexUrl);
    const saga = sagas.find(s => s.url === sagaUrl);

    if (!saga) {
      console.warn(`[pkproject] Saga not found for URL: ${sagaUrl}`);
      return [];
    }

    const allChapters: MangaChapter[] = [];
    for (const volumeUrl of saga.volumeUrls) {
      const chapters = await this.getVolumeChapters(volumeUrl);
      allChapters.push(...chapters);
    }
    return allChapters;
  }

  /** Fetch the chapter list for a single volume page. */
  private async getVolumeChapters(volumeUrl: string): Promise<MangaChapter[]> {
    const html = await fetchHtmlSafe(volumeUrl);
    if (!html) {
      console.warn(`[pkproject] Failed to fetch volume: ${volumeUrl}`);
      return [];
    }

    const $ = cheerio.load(html);
    const chapters: MangaChapter[] = [];

    $('.manga_ch_list a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();
      if (!href || !title) return;
      const url = href.startsWith('http') ? href : `${BASE}${href}`;
      chapters.push({ title, url, number: normalizeChapterNumber(title) });
    });

    return chapters;
  }

  private toSearchResult(saga: SagaEntry): MangaSearchResult {
    // Strip " - Tomo N" from the full title for the display title.
    const title = saga.fullTitle.replace(/\s*-\s*Tomo\s*\d+$/i, '').trim() || saga.sagaName;
    return { title, url: saga.url, cover: saga.cover };
  }

  private titleFromUrl(url: string): string {
    const parts = url.replace(/^https?:\/\/pkproject\.net\/manga\//, '').split('/');
    return parts
      .map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .join(' - ');
  }
}
