import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { MyrientScrapeService } from './services/myrient.service';
import { MangaScraperService } from './services/manga.service';
import { MangaBrowserService } from './services/manga/manga-browser.service';
import { MangaEditorService } from './services/manga/manga-editor.service';
import { MangaConfigService, type MangaConfig, type SeriesConfig, type SeriesStatus } from './services/manga/manga-config.service';
import { MangaCronService } from './services/manga/manga-cron.service';
import type {
  MangaSearchResult,
  MangaChapter,
  MangaChapterDownloadResult,
  LocalMangaLibrary,
  ChapterPageInfo,
} from './services/manga/manga.types';
import type { EpubMetadata } from './services/manga/manga-epub.builder';
import { EuropeAggregateResult } from './entities/europe-aggregate.entity';
import { DownloadResult } from './entities/download-result.entity';
import { BulkDownloadResult } from './entities/bulk-download-result.entity';
import { LocalGamesResult, SearchLocalGamesResult, CatalogSearchResult } from './entities/local-games.entity';
import { DownloadAllGamesDto } from './dto/download-all-games.dto';
import { DownloadSelectedGamesDto } from './dto/download-selected-games.dto';
import { MyrientConsole } from './enums/myrient-console.enum';

@Injectable()
export class ScrapeFacadeService {
  constructor(
    private readonly myrientScrapeService: MyrientScrapeService,
    private readonly mangaScraperService: MangaScraperService,
    private readonly mangaBrowserService: MangaBrowserService,
    private readonly mangaEditorService: MangaEditorService,
    private readonly mangaConfigService: MangaConfigService,
    private readonly mangaCronService: MangaCronService,
  ) {}

  // ==================== MYRIENT SCRAPING ====================

  async resolveLocalFile(consoleKey: MyrientConsole, filename: string): Promise<{ filePath: string; safeName: string }> {
    return this.myrientScrapeService.resolveLocalFile(consoleKey, filename);
  }

  async getLocalGames(consoleKey: MyrientConsole, regions: string[]): Promise<LocalGamesResult> {
    return this.myrientScrapeService.getLocalGames(consoleKey, regions);
  }

  async searchLocalGames(query: string, regions: string[]): Promise<SearchLocalGamesResult> {
    return this.myrientScrapeService.searchLocalGames(query, regions);
  }

  async searchCatalog(query: string, regions: string[]): Promise<CatalogSearchResult> {
    return this.myrientScrapeService.searchCatalog(query, regions);
  }

  async getMyrientCatalog(consoleKey: MyrientConsole, regions: string[]): Promise<EuropeAggregateResult> {
    try {
      return await this.myrientScrapeService.scrapeCatalog(consoleKey, regions);
    } catch (error) {
      console.error('Error scraping Myrient catalog:', error);
      throw new Error(`Failed to scrape catalog: ${(error as Error).message}`);
    }
  }

  // ==================== DOWNLOADS ====================

  async downloadGame(url: string): Promise<DownloadResult> {
    try {
      return await this.myrientScrapeService.downloadGame(url);
    } catch (error) {
      console.error('Error downloading game from Myrient:', error);
      throw new Error(`Failed to download game: ${(error as Error).message}`);
    }
  }

  async downloadAllGames(dto: DownloadAllGamesDto): Promise<BulkDownloadResult> {
    try {
      return await this.myrientScrapeService.downloadAllGames(dto);
    } catch (error) {
      console.error('Error in bulk download from Myrient:', error);
      throw new Error(`Bulk download failed: ${(error as Error).message}`);
    }
  }

  async downloadSelectedGames(dto: DownloadSelectedGamesDto): Promise<BulkDownloadResult> {
    try {
      return await this.myrientScrapeService.downloadSelectedGames(dto);
    } catch (error) {
      console.error('Error in selected download from Myrient:', error);
      throw new Error(`Selected download failed: ${(error as Error).message}`);
    }
  }

  streamDownloadSelected(dto: DownloadSelectedGamesDto): AsyncGenerator<string> {
    return this.myrientScrapeService.streamDownloadSelected(dto);
  }

  // ==================== MANGA SCRAPER ====================

  async searchManga(query: string): Promise<MangaSearchResult[]> {
    try {
      return await this.mangaScraperService.searchNovels(query);
    } catch (error) {
      throw new Error(`Failed to search manga: ${(error as Error).message}`);
    }
  }

  async getNovelInfo(novelUrl: string): Promise<{ title: string; url: string }> {
    try {
      return await this.mangaScraperService.getNovelInfo(novelUrl);
    } catch (error) {
      throw new Error(`Failed to fetch novel info: ${(error as Error).message}`);
    }
  }

  async getMangaChapters(novelUrl: string): Promise<MangaChapter[]> {
    try {
      return await this.mangaScraperService.getChapterList(novelUrl);
    } catch (error) {
      throw new Error(`Failed to fetch chapter list: ${(error as Error).message}`);
    }
  }

  async downloadMangaChapter(chapterUrl: string, saveDir: string): Promise<MangaChapterDownloadResult> {
    try {
      return await this.mangaScraperService.downloadChapter(chapterUrl, saveDir);
    } catch (error) {
      throw new Error(`Failed to download chapter: ${(error as Error).message}`);
    }
  }

  streamDownloadMangaNovel(novelUrl: string, from?: number, to?: number, skipDownloaded = true): AsyncGenerator<string> {
    return this.mangaScraperService.streamDownloadNovel(novelUrl, from, to, skipDownloaded);
  }

  async getLocalMangaLibrary(): Promise<LocalMangaLibrary> {
    return this.mangaScraperService.getLocalLibrary();
  }

  // ==================== BROWSER CONFIG ====================

  getBrowserConfig(): { tunnelEnabled: boolean; tunnelAvailable: boolean } {
    return {
      tunnelEnabled: this.mangaBrowserService.getTunnelEnabled(),
      tunnelAvailable: this.mangaBrowserService.tunnelAvailable(),
    };
  }

  async setBrowserTunnel(enabled: boolean): Promise<{ tunnelEnabled: boolean; tunnelAvailable: boolean }> {
    await this.mangaBrowserService.setTunnelEnabled(enabled);
    return this.getBrowserConfig();
  }

  // ==================== MANGA EDITOR ====================

  getMangaChapterPageList(series: string, chapter: string): Promise<ChapterPageInfo[]> {
    return this.mangaEditorService.getChapterPageList(series, chapter);
  }

  serveChapterImage(series: string, chapter: string, page: number, res: Response): Promise<void> {
    return this.mangaEditorService.serveChapterImage(series, chapter, page, res);
  }

  convertMangaChapter(series: string, chapter: string, excludePages: number[], includeCover?: boolean, metadata?: EpubMetadata): Promise<{ outputPath: string }> {
    return this.mangaEditorService.convertChapter(series, chapter, excludePages, includeCover, metadata);
  }

  async patchMangaEpubMetadata(series: string, chapters: string[], metadata: EpubMetadata): Promise<{ results: { chapter: string; updated: boolean }[]; updated: number }> {
    const results: { chapter: string; updated: boolean }[] = [];
    for (const chapter of chapters) {
      const result = await this.mangaEditorService.patchEpubMetadata(series, chapter, metadata);
      results.push({ chapter, updated: result.updated });
    }
    return { results, updated: results.filter(r => r.updated).length };
  }

  // ==================== MANGA CONFIG ====================

  getMangaConfig(): MangaConfig {
    return this.mangaConfigService.getConfig();
  }

  async updateMangaConfig(patch: { cron?: Partial<MangaConfig['cron']> }): Promise<MangaConfig> {
    if (patch.cron) {
      await this.mangaConfigService.updateCron(patch.cron);
      await this.mangaCronService.syncCronJob();
    }
    return this.mangaConfigService.getConfig();
  }

  async updateSeriesStatus(slug: string, status: SeriesStatus): Promise<SeriesConfig> {
    return this.mangaConfigService.updateSeriesConfig(slug, { status });
  }

  async runMangaCron(): Promise<{ message: string }> {
    // Fire and forget — don't await; return immediately
    this.mangaCronService.runAutoUpdate().catch(() => undefined);
    return { message: 'Manga auto-update started in background.' };
  }
}
