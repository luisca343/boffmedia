import { Module } from '@nestjs/common';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [DiscordController],
  providers: [MySQL2Service]
})
export class DiscordModule {}
