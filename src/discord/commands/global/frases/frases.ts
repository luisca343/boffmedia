import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';
import { EmbedBuilder } from 'discord.js';

@Injectable()
export class FrasesCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'frases',
    description: 'Mostrar las frases',
    guilds: ['516237304101339156'],
  })
  public async onFrases(@Context() [interaction]: SlashCommandContext) {
    const user = interaction.options.getUser('usuario') || null;
    const page = interaction.options.getInteger('page') || 1;
    const { embed } = await this.createEmbed(interaction.guildId, user?.id, page);

    await interaction.reply({ embeds: [embed] });
  }

  private async createEmbed(guildId: string, userId: string | null, page: number) {
    const { totalPages, frases } = await this.service.getFrases(guildId, userId, page, 10);
    const fields = frases.map((frase) => ({
      name: `**"${frase.quote}" **`,
      value: `*${frase.discordName} - ${formatDate(frase.createdAt)}*`,
    }));

    const embed = new EmbedBuilder()
      .setColor(`#${frases[0]?.color || '0099ff'}`)
      .setAuthor({
        name: userId ? frases[0]?.discordName : 'Ficus Quotes',
        iconURL: 'https://cdn.discordapp.com/avatars/1170322183646629900/2eed87d0ae9928401f02ddcd10c2e590.webp?size=32',
      })
      .setTimestamp()
      .addFields(fields);

    return { embed };
  }
}
