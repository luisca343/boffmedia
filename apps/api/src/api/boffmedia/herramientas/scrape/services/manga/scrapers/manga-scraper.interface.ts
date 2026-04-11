// ---------------------------------------------------------------------------
// IMangaScraper — contract every manga scraper must fulfil.
//
// All page-fetching methods receive a BrowserContext so scrapers that need
// a real browser (to bypass bot-detection, render JS, etc.) can use it for
// every operation, not just chapter images.
//
// Adding a new scraper:
//   1. Create a class that implements this interface.
//   2. Register it in MangaScraperRegistry (manga-registry.service.ts).
//   That's it — no other files need to change.
// ---------------------------------------------------------------------------

import { BrowserContext } from 'playwright';
import { MangaChapter, MangaSearchResult } from '../manga.types';

export interface IMangaScraper {
  /** Unique identifier for this scraper, e.g. "novelcool-es". */
  readonly name: string;

  /**
   * Whether this source requires a headless browser (Playwright) for chapter
   * image pages. Even when false, all methods still receive a BrowserContext
   * and may use it if needed.
   */
  readonly requiresBrowser: boolean;

  /** Returns true if this scraper can handle the given URL. */
  canHandle(url: string): boolean;

  /** Search for manga series matching the query. */
  search(query: string, context: BrowserContext): Promise<MangaSearchResult[]>;

  /** Fetch the human-readable title from the novel landing page. */
  getTitle(novelUrl: string, context: BrowserContext): Promise<string>;

  /**
   * Return the full ordered chapter list for a novel (oldest chapter first).
   * Each entry includes the normalised chapter number.
   */
  getChapterList(novelUrl: string, context: BrowserContext): Promise<MangaChapter[]>;

  /**
   * Scrape and return all image URLs for a single chapter page.
   * The BrowserContext is always provided; use it when the page requires
   * JavaScript execution (requiresBrowser = true), ignore it otherwise.
   */
  getChapterImages(chapterUrl: string, context: BrowserContext): Promise<string[]>;
}
