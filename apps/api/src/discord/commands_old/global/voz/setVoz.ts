import { CommandsService } from '@/discord/_commands/commands.service';
import { getVoices, setVoice } from '@/discord/_util/audio';
import { SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('setvoz')
  .setDescription('Cambiar la voz del bot')
  .addIntegerOption((option) =>
    option
      .setName('voz')
      .setDescription('Voz a utilizar')
      .setRequired(true)
      .setAutocomplete(true),
  );

async function execute(interaction, service: CommandsService) {
  const voz = interaction.options.getInteger('voz');
  setVoice(service, interaction.user.id, voz);

  await interaction.reply('Voz cambiada');
}

async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const choices = await getVoices();
  let filtered = choices.filter((choice) =>
    choice.name.toLowerCase().includes(focusedValue.toLowerCase()),
  );

  if (filtered.length >= 20) {
    filtered = choices.slice(0, 20);
  }

  await interaction.respond(
    filtered.map((choice) => ({ name: choice.name, value: choice.value })),
  );
}

module.exports = {
  data,
  execute,
  autocomplete,
};
