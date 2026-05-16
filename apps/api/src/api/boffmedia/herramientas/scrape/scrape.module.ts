import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';

import { MyrientScrapeService } from './services/myrient.service';
import { MangaBrowserService } from './services/manga/manga-browser.service';
import { MangaScraperRegistry } from './services/manga/manga-registry.service';
import { MangaLibraryService } from './services/manga/manga-library.service';
import { MangaDownloadService } from './services/manga/manga-download.service';
import { MangaScraperService } from './services/manga.service';
import { MangaEditorService } from './services/manga/manga-editor.service';
import { MangaConfigService } from './services/manga/manga-config.service';
import { MangaCronService } from './services/manga/manga-cron.service';
import { ScrapeFacadeService } from './scrape.facade.service';
import { ScrapeController } from './scrape.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [ScrapeController],
  providers: [
    MyrientScrapeService,
    // Manga config (no dependencies — must come first)
    MangaConfigService,
    // Manga sub-services (ordered by dependency)
    MangaBrowserService,
    MangaScraperRegistry,
    MangaLibraryService,
    MangaDownloadService,
    MangaScraperService,
    MangaEditorService,
    MangaCronService,
    ScrapeFacadeService,
  ],
  exports: [ScrapeFacadeService],
})
export class ScrapeModule {}
