const { SlashCommandBuilder } = require('@discordjs/builders');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

async function execute(interaction) {
    console.log('ping command executed');
    await interaction.reply('Pong!');
}

module.exports = {
    data,
    execute,
};