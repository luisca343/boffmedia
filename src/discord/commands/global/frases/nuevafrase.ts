import { CommandsService } from "@/discord/_commands/commands.service";
import { SlashCommandBuilder, User } from "discord.js";

const data = new SlashCommandBuilder()
    .setName('nuevafrase')
    .setDescription('Añadir una nueva frase')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario a buscar').setRequired(true))
    .addStringOption(option => option.setName('frase').setDescription('Frase a añadir').setRequired(true))
    .addStringOption(option => option.setName('comentario').setDescription('Comentario adicional'));

async function autocomplete(interaction, db= null){
    return true
}

async function execute(interaction, service: CommandsService) {
    const user = interaction.options.getUser('usuario') as User;
    const quote = interaction.options.getString('frase') as string;
    const comment = interaction.options.getString('comentario') as string;
    
    const response = await service.addQuote(interaction.guildId, user, quote, comment);
    
    await interaction.reply(response);
}

export { data,autocomplete,  execute };