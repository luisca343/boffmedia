import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext, Options } from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { FrasesDto } from './frases.dto';

@Injectable()
export class FrasesCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'frases',
    description: 'Mostrar las frases',
    guilds: ['516237304101339156'],
  })
  public async onFrases(
    @Context() [interaction]: SlashCommandContext,
    @Options() { usuario, page }: FrasesDto
  ) {
    const guildId = interaction.guildId;
    const userId = usuario?.id || null; // Extract the ID from the User object
    const { embed, row } = await this.createEmbed(guildId, userId, page || 1);

    try {
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error replying to interaction:', error);
    }
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
        iconURL: frases[0]?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
      })
      .setTimestamp()
      .addFields(fields);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`prev_page:${guildId}:${userId}:${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),
      new ButtonBuilder()
        .setCustomId(`next_page:${guildId}:${userId}:${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages)
    );

    return { embed, row };
  }

  public async handleButton(interaction: ButtonInteraction) {
    const [action, guildId, userId, page] = interaction.customId.split(':');

    if (action === 'prev_page' || action === 'next_page') {
      const newPage = parseInt(page, 10);
      const { embed, row } = await this.createEmbed(guildId, userId === 'null' ? null : userId, newPage);

      await interaction.update({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ content: 'Unknown action!', ephemeral: true });
    }
  }
}
