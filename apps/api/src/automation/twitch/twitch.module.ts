import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TwitchController } from './twitch.controller';
import { TwitchDebugController } from './twitch-debug.controller';
import { TwitchApiService } from './services/twitch-api.service';
import { TwitchMonitorService } from './services/twitch-monitor.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot(), ConfigModule],
  controllers: [TwitchController, TwitchDebugController],
  providers: [TwitchApiService, TwitchMonitorService, NotificationService],
  exports: [TwitchApiService, TwitchMonitorService, NotificationService],
})
export class TwitchModule {}
