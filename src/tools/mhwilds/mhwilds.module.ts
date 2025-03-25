import { DrizzleModule } from '@/drizzle/drizzle.module';
import { LoggerModule } from '@/logger/logger.module';
import { Module } from '@nestjs/common';
import { MhwildsController } from './mhwilds.controller';
import { MhwildsService } from './mhwilds.service';
import { ResponseService } from '@/response/response.service';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [MhwildsController],
  providers: [MhwildsService, ResponseService],
})
export class MhwildsModule {}