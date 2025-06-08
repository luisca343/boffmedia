import { Module } from '@nestjs/common';
import { WingullController } from './wingull.controller';
import { WingullService } from './wingull.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [WingullController],
  providers: [WingullService],
  exports: [WingullService],
})
export class WingullModule {}
