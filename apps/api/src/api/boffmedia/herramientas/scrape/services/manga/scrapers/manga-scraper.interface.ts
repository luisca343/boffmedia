// ---------------------------------------------------------------------------
// IMangaScraper — contract every manga scraper must fulfil.
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
   * Whether this source requires a headless browser (Playwright) to render
   * chapter pages. If false, getChapterImages may ignore the BrowserContext.
   */
  readonly requiresBrowser: boolean;

  /** Returns true if this scraper knows how to handle the given URL. */
  canHandle(url: string): boolean;

  /** Search for manga series matching the query. */
  search(query: string): Promise<MangaSearchResult[]>;

  /** Fetch the human-readable title from its landing page. */
  getTitle(novelUrl: string): Promise<string>;

  /**
   * Return the full ordered chapter list for a novel (oldest chapter first).
   * Each entry includes the normalised chapter number.
   */
  getChapterList(novelUrl: string): Promise<MangaChapter[]>;

  /**
   * Scrape and return all image URLs for a single chapter page.
   * A Playwright BrowserContext is always provided; use it when the page
   * requires JavaScript execution (requiresBrowser = true), ignore it
   * otherwise.
   */
  getChapterImages(chapterUrl: string, context: BrowserContext): Promise<string[]>;
}
