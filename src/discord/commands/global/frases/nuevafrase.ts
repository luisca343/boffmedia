import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';

@Injectable()
export class NuevaFraseCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'nuevafrase',
    description: 'Añadir una nueva frase',
    guilds: ['516237304101339156'],
  })
  public async onNuevaFrase(@Context() [interaction]: SlashCommandContext) {
    const user = interaction.options.getUser('usuario');
    const quote = interaction.options.getString('frase');
    const comment = interaction.options.getString('comentario');

    const response = await this.service.addQuote(interaction.guildId, user, quote, comment);
    await interaction.reply(response);
  }
}
