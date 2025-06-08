import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';
import { WingullModule } from '../wingull/wingull.module';

@Module({
  imports: [LoggerModule, ResponseModule, WingullModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService]
})
export class RegionModule {}
