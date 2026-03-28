import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';

import { MyrientScrapeService } from './services/myrient.service';
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
    ScrapeFacadeService,
  ],
  exports: [ScrapeFacadeService],
})
export class ScrapeModule {}
