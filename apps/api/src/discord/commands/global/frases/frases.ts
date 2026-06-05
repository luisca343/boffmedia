/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — dynamic data access patterns not statically typeable
import { Injectable } from '@nestjs/common';
import {
  Context,
  SlashCommand,
  SlashCommandContext,
  Options,
  Button,
  ButtonContext,
  ComponentParam,
} from 'necord';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { FrasesDto } from './_dto/frases.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class FrasesCommand {
  constructor(
    private readonly logger: Logger,
    private readonly service: CommandsService,
  ) {}

  @SlashCommand({
    name: 'frases',
    description: 'Mostrar las frases',
    guilds: ['516237304101339156'],
  })
  public async onFrases(
    @Context() [interaction]: SlashCommandContext,
    @Options() { usuario, page }: FrasesDto,
  ) {
    const guildId = interaction.guildId;
    const userId = usuario?.id || null; // Extract the ID from the User object
    const { embed, row } = await this.createEmbed(guildId, userId, page || 1);

    try {
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      this.logger.error('Error replying to interaction:', error);
    }
  }

  private async createEmbed(
    guildId: string,
    userId: string | null,
    page: number,
  ) {
    const { totalPages, frases } = await this.service.getFrases(
      guildId,
      userId,
      page,
      10,
    );
    const fields = frases.map((frase) => ({
      name: `**"${frase.quote}" **`,
      value: `*${frase.discordName} - ${formatDate(frase.createdAt)}*`,
    }));

    const embed = new EmbedBuilder()
      .setColor(`#${frases[0]?.color || '0099ff'}`)
      .setAuthor({
        name: userId ? frases[0]?.discordName : 'Ficus Quotes',
        iconURL:
          frases[0]?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
      })
      .setTimestamp()
      .addFields(fields);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`frases_pagina/first/${guildId}/${userId || 'null'}/1`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1)
        .setEmoji('1179812310534062090'),
      new ButtonBuilder()
        .setCustomId(
          `frases_pagina/prev/${guildId}/${userId || 'null'}/${page - 1}`,
        )
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1)
        .setEmoji('1179812305530277909'),
      new ButtonBuilder()
        .setCustomId(
          `frases_pagina/next/${guildId}/${userId || 'null'}/${page + 1}`,
        )
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages)
        .setEmoji('1179812307073773568'),
      new ButtonBuilder()
        .setCustomId(
          `frases_pagina/last/${guildId}/${userId || 'null'}/${totalPages}`,
        )
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages)
        .setEmoji('1179812309338701835'),
    );

    return { embed, row };
  }

  @Button('frases_pagina/:direction/:guildId/:userId/:page')
  public async onButton(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('direction') direction: string,
    @ComponentParam('guildId') guildId: string,
    @ComponentParam('userId') userId: string,
    @ComponentParam('page') page: string,
  ) {
    try {
      const newPage = parseInt(page, 10);
      const userIdParam = userId === 'null' ? null : userId;
      const { embed, row } = await this.createEmbed(
        guildId,
        userIdParam,
        newPage,
      );

      await interaction.update({ embeds: [embed], components: [row] });
    } catch (error: any) {
      this.logger.error('Error handling button interaction:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: 'There was an error while processing the interaction.',
          ephemeral: true,
        });
      }
    }
  }
}
