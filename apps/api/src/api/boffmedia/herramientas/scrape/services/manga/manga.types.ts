// ---------------------------------------------------------------------------
// Shared manga types — used across scrapers, services, and the facade.
// ---------------------------------------------------------------------------

export interface MangaSearchResult {
  title: string;
  url: string;
  cover: string;
}

export interface MangaChapter {
  /** Raw title as scraped from the source site (e.g. "Capítulo 35"). */
  title: string;
  /** Absolute URL to the chapter page. */
  url: string;
  /**
   * Normalised chapter number extracted from the title.
   * "Capítulo 35" → 35, "Capítulo 33.50" → 33.5, null when unparseable.
   */
  number: number | null;
}

export interface MangaChapterDownloadResult {
  chapter: string;
  imageUrls: string[];
  downloaded: number;
  skipped: number;
  failed: number;
  saveDir: string;
}

export interface LocalMangaChapter {
  slug: string;
  imageCount: number;
}

export interface LocalMangaSeries {
  slug: string;
  chapters: LocalMangaChapter[];
  totalImages: number;
}

export interface LocalMangaLibrary {
  series: LocalMangaSeries[];
  totalSeries: number;
  totalChapters: number;
}
