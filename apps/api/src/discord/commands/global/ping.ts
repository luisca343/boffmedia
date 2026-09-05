import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { Logger } from 'nestjs-pino';
import { DISCORD_GUILDS } from '../../_main/discord.config';

@Injectable()
export class PingCommand {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({
    name: 'ping',
    description: 'Replies with Pong!',
    guilds: DISCORD_GUILDS,
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    this.logger.log('[DEBUG] PingCommand executed');
    return interaction.reply({ content: 'Pong!' });
  }
}
