import { Injectable, Logger } from '@nestjs/common';
import { isDiscordBotEnabled } from './discord.config';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor() {
    // One line at boot saying which of the two supported shapes this process
    // is running, so "the bot is not answering" is one grep away from "the bot
    // was never started here".
    this.logger.log(
      isDiscordBotEnabled()
        ? 'Discord bot enabled — gateway client starting in the background'
        : 'Discord bot DISABLED (DISCORD_BOT_ENABLED=false or no DISCORD_KEY) — API runs without it',
    );
  }
}
