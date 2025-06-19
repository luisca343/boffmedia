import { Module } from '@nestjs/common';
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { AppsRepository } from './repositories/apps.repository';
import { UserAppsRepository } from './repositories/user-apps.repository.interface';
import { ResponseService } from '@api/_utils/response/response.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { APPS_REPOSITORY_TOKEN, USER_APPS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [AppsController],
  providers: [
    AppsFacadeService,
    AppsService,
    UserAppsService,
    ResponseService,
    {
      provide: APPS_REPOSITORY_TOKEN,
      useClass: AppsRepository,
    },
    {
      provide: USER_APPS_REPOSITORY_TOKEN,
      useClass: UserAppsRepository,
    },
  ],
  exports: [AppsFacadeService, AppsService, UserAppsService],
})
export class SmartRotomAppsModule {}