// ---------------------------------------------------------------------------
// MangaScraperService — thin orchestrator consumed by ScrapeFacadeService.
//
// All domain logic lives in the manga/ sub-services:
//   MangaScraperRegistry  — scraper lookup by URL
//   MangaLibraryService   — local disk library
//   MangaDownloadService  — Playwright browser + download + SSE streaming
//
// Public method signatures are intentionally kept stable so the facade
// requires no changes when internal implementation details evolve.
// ---------------------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import { MangaScraperRegistry } from './manga/manga-registry.service';
import { MangaLibraryService } from './manga/manga-library.service';
import { MangaDownloadService } from './manga/manga-download.service';

// Re-export all shared types so the facade can import from one place.
export type {
  MangaSearchResult,
  MangaChapter,
  MangaChapterDownloadResult,
  LocalMangaChapter,
  LocalMangaSeries,
  LocalMangaLibrary,
} from './manga/manga.types';

@Injectable()
export class MangaScraperService {
  constructor(
    private readonly registry: MangaScraperRegistry,
    private readonly libraryService: MangaLibraryService,
    private readonly downloadService: MangaDownloadService,
  ) {}

  // ── Library ────────────────────────────────────────────────────────────────

  async getLocalLibrary() {
    return this.libraryService.getLocalLibrary();
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  /**
   * Searches all registered scrapers in parallel and aggregates the results.
   * Errors from individual scrapers are logged and suppressed so a failing
   * source doesn't prevent results from healthy ones.
   */
  async searchNovels(query: string) {
    const results = await Promise.allSettled(
      this.registry.getAll().map((scraper) => scraper.search(query)),
    );
    return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  }

  // ── Novel info ─────────────────────────────────────────────────────────────

  async getNovelInfo(
    novelUrl: string,
  ): Promise<{ title: string; url: string }> {
    const scraper = this.registry.resolve(novelUrl);
    const title = await scraper.getTitle(novelUrl);
    return { title, url: novelUrl };
  }

  // ── Chapter list ───────────────────────────────────────────────────────────

  async getChapterList(novelUrl: string) {
    const scraper = this.registry.resolve(novelUrl);
    return scraper.getChapterList(novelUrl);
  }

  // ── Downloads ──────────────────────────────────────────────────────────────

  async downloadChapter(chapterUrl: string, saveDir: string) {
    return this.downloadService.downloadChapter(chapterUrl, saveDir);
  }

  streamDownloadNovel(
    novelUrl: string,
    from: number = 1,
    to?: number,
    skipDownloaded = true,
  ): AsyncGenerator<string> {
    return this.downloadService.streamDownloadNovel(
      novelUrl,
      from,
      to,
      skipDownloaded,
    );
  }
}
