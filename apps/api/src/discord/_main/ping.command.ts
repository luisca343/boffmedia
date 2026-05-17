import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PingCommand {
  constructor(private readonly logger: Logger) {}

  @SlashCommand({
    name: 'ping',
    description: '¡Comando de ping!',
    guilds: ['516237304101339156'],
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    this.logger.log('[DEBUG] PingCommand executed');
    return interaction.reply({ content: '¡Pong!' });
  }
}
