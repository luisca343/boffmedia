import { Module } from '@nestjs/common';
import { WingullController } from './wingull.controller';
import { WingullService } from './wingull.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [WingullController],
  providers: [WingullService],
  exports: [WingullService],
})
export class WingullModule {}
