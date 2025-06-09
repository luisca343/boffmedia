import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { MhwildsDataService } from './services/mhwilds-data.service';
import { MhwildsCacheService } from './services/mhwilds-cache.service';
import { MhwildsFacadeService } from './mhwilds.facade.service';
import { MhwildsController } from './mhwilds.controller';
import { MhwildsRepository } from '@repositories/mhwilds.repository';

@Module({
  imports: [
    LoggerModule,
    DrizzleModule,
    ResponseModule
  ],
  controllers: [MhwildsController],
  providers: [
    MhwildsRepository,
    MhwildsDataService,
    MhwildsCacheService,
    MhwildsFacadeService,
  ],
  exports: [
    MhwildsFacadeService,
  ],
})
export class MhwildsModule {}