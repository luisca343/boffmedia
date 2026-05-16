import { ficusFrases } from '@/_db/schema/Ficus';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  EmbedBuilder,
} from 'discord.js';
import { eq, or } from 'drizzle-orm';

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandsService } from '@/discord/_commands/commands.service';
import { formatDate } from '@/_utils/stringUtils';

const data = new SlashCommandBuilder()
  .setName('frase')
  .setDescription('Mostrar las frase')
  .addUserOption((option) =>
    option.setName('usuario').setDescription('Usuario a buscar'),
  )
  .addIntegerOption((option) =>
    option
      .setName('num')
      .setDescription('Número de la frase')
      .setRequired(false),
  )
  .addBooleanOption((option) =>
    option
      .setName('global')
      .setDescription('Buscar en todas las frases')
      .setRequired(false),
  );

async function execute(interaction, service: CommandsService) {
  if (!interaction.isCommand()) return;

  const user = interaction.options.getUser('usuario') || null;
  const num = interaction.options.getInteger('num') || 0;
  const global = interaction.options.getBoolean('global') || false;
  const frase = await service.getQuote(
    interaction.guildId,
    user?.id,
    num,
    global,
  );

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

  interaction.reply({ embeds: [embed] });
}

module.exports = {
  data,
  execute,
};
