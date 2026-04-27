import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';

import { MyrientScrapeService } from './services/myrient.service';
import { MangaBrowserService } from './services/manga/manga-browser.service';
import { MangaScraperRegistry } from './services/manga/manga-registry.service';
import { MangaLibraryService } from './services/manga/manga-library.service';
import { MangaDownloadService } from './services/manga/manga-download.service';
import { MangaScraperService } from './services/manga.service';
import { ScrapeFacadeService } from './scrape.facade.service';
import { ScrapeController } from './scrape.controller';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
  ],
  controllers: [ScrapeController],
  providers: [
    MyrientScrapeService,
    // Manga sub-services (ordered by dependency)
    MangaBrowserService,
    MangaScraperRegistry,
    MangaLibraryService,
    MangaDownloadService,
    MangaScraperService,
    ScrapeFacadeService,
  ],
  exports: [ScrapeFacadeService],
})
export class ScrapeModule {}
