import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';
import { EmbedBuilder } from 'discord.js';

@Injectable()
export class FraseCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'frase',
    description: 'Mostrar las frase',
    guilds: ['516237304101339156'],
  })
  public async onFrase(@Context() [interaction]: SlashCommandContext) {
    const user = interaction.options.getUser('usuario') || null;
    const num = interaction.options.getInteger('num') || 0;
    const global = interaction.options.getBoolean('global') || false;
    const frase = await this.service.getQuote(interaction.guildId, user?.id, num, global);

    if (!frase) {
      await interaction.reply('No se ha encontrado la frase');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(`#${frase.color || '0099ff'}`)
      .setAuthor({ name: `${frase.discordName}`, iconURL: `${frase.avatar}` })
      .setTimestamp()
      .setDescription(`**"${frase.quote}" **`)
      .setFooter({ text: `Añadida el ${formatDate(frase.createdAt)}` });

    await interaction.reply({ embeds: [embed] });
  }
}
