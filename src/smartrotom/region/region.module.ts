import { Module } from '@nestjs/common';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { RegionController } from './region.controller';
import { RegionService } from './region.service';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService]
})
export class RegionModule {}
