import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext, Options } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';
import { EmbedBuilder } from 'discord.js';
import { FraseDto } from './_dto/frase.dto';

@Injectable()
export class FraseCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'frase',
    description: 'Mostrar las frase',
    guilds: ['516237304101339156'],
  })
  public async onFrase(
    @Context() [interaction]: SlashCommandContext,
    @Options() { usuario, num, global }: FraseDto,
  ) {
    const userId = usuario?.id || null;
    const frase = await this.service.getQuote(
      interaction.guildId!,
      userId ?? '',
      num || 0,
      global || false,
    );

    if (!frase) {
      await interaction.reply('No se ha encontrado la frase');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(`#${frase.color || '0099ff'}`)
      .setAuthor({
        name: `${frase.discordName}`,
        iconURL:
          frase.avatar && frase.avatar.startsWith('http')
            ? frase.avatar
            : undefined,
      })
      .setTimestamp()
      .setDescription(`**"${frase.quote}" **`)
      .setFooter({ text: `Añadida el ${formatDate(frase.createdAt)}` });

    await interaction.reply({ embeds: [embed] });
  }
}
