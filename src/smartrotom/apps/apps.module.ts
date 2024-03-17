import { Module } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsController } from './apps.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  imports: [],
  controllers: [AppsController],
  providers: [AppsService, MySQL2Service],
})
export class SmartRotomAppsModule {}
