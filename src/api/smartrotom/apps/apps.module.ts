import { Module } from '@nestjs/common';
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { AppsRepository } from '@api/_repositories/smartrotom/apps.repository';
import { ResponseService } from '@api/_utils/response/response.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [AppsController],
  providers: [
    AppsFacadeService,
    AppsService,
    UserAppsService,
    AppsRepository,
    ResponseService,
  ],
  exports: [AppsFacadeService, AppsService, UserAppsService],
})
export class SmartRotomAppsModule {}