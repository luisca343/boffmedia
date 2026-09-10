import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { MhwildsDataService } from './services/mhwilds-data.service';
import { MhwildsCacheService } from './services/mhwilds-cache.service';
import { MhwildsFacadeService } from './mhwilds.facade.service';
import { MhwildsController } from './mhwilds.controller';
import { MhwildsAnatomyController } from './mhwilds-anatomy.controller';
import { MhwildsAnatomyAdminController } from './mhwilds-anatomy-admin.controller';
import { MhwildsRepository } from './repositories/mhwilds.repository';
import { MhwildsAnatomyService } from './services/mhwilds-anatomy.service';
import { MHWILDS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [LoggerModule, DrizzleModule, ResponseModule],
  controllers: [
    MhwildsController,
    MhwildsAnatomyController,
    MhwildsAnatomyAdminController,
  ],
  providers: [
    MhwildsDataService,
    MhwildsCacheService,
    MhwildsAnatomyService,
    MhwildsFacadeService,
    {
      provide: MHWILDS_REPOSITORY_TOKEN,
      useClass: MhwildsRepository,
    },
  ],
  exports: [MhwildsFacadeService, MhwildsDataService, MhwildsCacheService],
})
export class MhwildsModule {}
