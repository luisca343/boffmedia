import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { ResponseService } from '@api/_utils/response/response.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [AppsController],
  providers: [AppsService, ResponseService],
})
export class SmartRotomAppsModule {}