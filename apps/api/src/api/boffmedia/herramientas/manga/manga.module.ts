import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { NovecoolService } from './services/novecool.service';
import { CbzService } from './services/cbz.service';
import { MangaDownloadService } from './services/manga-download.service';
import { MangaFacadeService } from './manga.facade.service';
import { MangaController } from './manga.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [MangaController],
  providers: [NovecoolService, CbzService, MangaDownloadService, MangaFacadeService],
  exports: [MangaFacadeService],
})
export class MangaModule {}
