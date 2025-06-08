import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { ResponseService } from '@/response/response.service';
import { LoggerModule } from '@/logger/logger.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [AppsController],
  providers: [AppsService, ResponseService],
})
export class SmartRotomAppsModule {}