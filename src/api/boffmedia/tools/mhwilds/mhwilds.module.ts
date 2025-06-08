import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { Module } from '@nestjs/common';
import { MhwildsController } from './mhwilds.controller';
import { MhwildsService } from './mhwilds.service';
import { ResponseService } from '@api/_utils/response/response.service';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [MhwildsController],
  providers: [MhwildsService, ResponseService],
})
export class MhwildsModule {}