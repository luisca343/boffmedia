import { Injectable } from '@nestjs/common';
import { MyrientScrapeService } from './services/myrient.service';
import {
  MangaScraperService,
  type MangaSearchResult,
  type MangaChapter,
  type MangaChapterDownloadResult,
  type MangaNovelDownloadResult,
} from './services/manga.service';
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
      throw new Error(`Manga search failed: ${(error as Error).message}`);
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

  async downloadMangaNovel(novelUrl: string, from?: number, to?: number): Promise<MangaNovelDownloadResult> {
    try {
      return await this.mangaScraperService.downloadNovel(novelUrl, from, to);
    } catch (error) {
      throw new Error(`Failed to download novel: ${(error as Error).message}`);
    }
  }

}
