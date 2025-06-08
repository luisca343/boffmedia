import { Module } from '@nestjs/common';
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { StarbankModule } from '../starbank/starbank.module';
import { WingullModule } from '../wingull/wingull.module';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, StarbankModule, WingullModule],
  controllers: [SmartrotomController],
  providers: [SmartrotomService],
  exports: [SmartrotomService]
})
export class SmartrotomModule {}
