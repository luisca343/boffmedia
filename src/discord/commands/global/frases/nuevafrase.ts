import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext, Options } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { NuevaFraseDto } from './_dto/nuevafrase.dto';

@Injectable()
export class NuevaFraseCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'nuevafrase',
    description: 'Añadir una nueva frase',
    guilds: ['516237304101339156'],
  })
  public async onNuevaFrase(
    @Context() [interaction]: SlashCommandContext,
    @Options() { usuario, frase, comentario }: NuevaFraseDto
  ) {
    const response = await this.service.addQuote(interaction.guildId, usuario, frase, comentario);
    await interaction.reply(response);
  }
}
