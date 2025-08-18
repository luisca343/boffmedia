import { Module } from '@nestjs/common';
import { TwitchModule } from './twitch/twitch.module';

@Module({
  imports: [TwitchModule],
  exports: [TwitchModule],
})
export class AutomationModule {}
