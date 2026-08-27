import { Module } from '@nestjs/common';
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';
import { ArceuspeakRepository } from './repositories/arceuspeak.repository';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '../starbank/starbank.module';
import { WingullModule } from '../wingull/wingull.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
    DrizzleModule,
    StarbankModule,
    WingullModule,
    NotificationsModule,
  ],
  controllers: [SmartrotomController],
  providers: [SmartrotomService, ArceuspeakRepository],
  exports: [SmartrotomService],
})
export class SmartrotomModule {}
