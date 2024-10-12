import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ResponseService } from '@/response/response.service';
import { LoggerModule } from '@/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [AppsController],
  providers: [AppsService, MySQL2Service, ResponseService],
})
export class SmartRotomAppsModule {}
