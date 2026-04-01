import { Injectable } from '@nestjs/common';
import { MyrientScrapeService } from './services/myrient.service';
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
      throw new Error(`Failed to scrape catalog: ${error.message}`);
    }
  }

  // ==================== DOWNLOADS ====================

  async downloadGame(url: string): Promise<DownloadResult> {
    try {
      return await this.myrientScrapeService.downloadGame(url);
    } catch (error) {
      console.error('Error downloading game from Myrient:', error);
      throw new Error(`Failed to download game: ${error.message}`);
    }
  }

  async downloadAllGames(dto: DownloadAllGamesDto): Promise<BulkDownloadResult> {
    try {
      return await this.myrientScrapeService.downloadAllGames(dto);
    } catch (error) {
      console.error('Error in bulk download from Myrient:', error);
      throw new Error(`Bulk download failed: ${error.message}`);
    }
  }

  async downloadSelectedGames(dto: DownloadSelectedGamesDto): Promise<BulkDownloadResult> {
    try {
      return await this.myrientScrapeService.downloadSelectedGames(dto);
    } catch (error) {
      console.error('Error in selected download from Myrient:', error);
      throw new Error(`Selected download failed: ${error.message}`);
    }
  }

  streamDownloadSelected(dto: DownloadSelectedGamesDto): AsyncGenerator<string> {
    return this.myrientScrapeService.streamDownloadSelected(dto);
  }
}
