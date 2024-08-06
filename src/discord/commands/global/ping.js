const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Ponga!'),
    async execute(interaction) {
		console.log('ping command executed');
        await interaction.reply('Pong!');
    },
};