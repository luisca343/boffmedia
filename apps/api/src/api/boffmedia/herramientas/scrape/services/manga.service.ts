// ---------------------------------------------------------------------------
// MangaScraperService — thin orchestrator consumed by ScrapeFacadeService.
//
// All domain logic lives in the manga/ sub-services:
//   MangaScraperRegistry  — scraper lookup by URL
//   MangaLibraryService   — local disk library
//   MangaDownloadService  — Playwright browser + download + SSE streaming
//
// Every network operation goes through a Playwright BrowserContext so the
// server is indistinguishable from a real browser, bypassing bot detection.
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
  MangaNovelDownloadResult,
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
   * Searches all registered scrapers in parallel through a shared Playwright
   * context. Results from all sources are aggregated; individual scraper
   * failures are silently dropped so one broken source doesn't block others.
   */
  async searchNovels(query: string) {
    return this.downloadService.withContext(async context => {
      const results = await Promise.allSettled(
        this.registry.getAll().map(scraper => scraper.search(query, context)),
      );
      return results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
    });
  }

  // ── Chapter list ───────────────────────────────────────────────────────────

  async getChapterList(novelUrl: string) {
    const scraper = this.registry.resolve(novelUrl);
    return this.downloadService.withContext(ctx =>
      scraper.getChapterList(novelUrl, ctx),
    );
  }

  // ── Downloads ──────────────────────────────────────────────────────────────

  async downloadChapter(chapterUrl: string, saveDir: string) {
    return this.downloadService.downloadChapter(chapterUrl, saveDir);
  }

  streamDownloadNovel(
    novelUrl: string,
    from: number = 1,
    to?: number,
  ): AsyncGenerator<string> {
    return this.downloadService.streamDownloadNovel(novelUrl, from, to);
  }
}
