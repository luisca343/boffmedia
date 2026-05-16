import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';

@Injectable()
export class PingCommand {
  @SlashCommand({
    name: 'ping',
    description: '¡Comando de ping!',
    guilds: ['516237304101339156'],
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    console.log('[DEBUG] PingCommand executed');
    return interaction.reply({ content: '¡Pong!' });
  }
}
