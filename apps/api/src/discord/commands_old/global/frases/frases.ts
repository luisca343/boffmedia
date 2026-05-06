import { ficusFrases } from "@/_db/schema/Ficus";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, EmbedBuilder } from "discord.js";
import { eq, or} from 'drizzle-orm';

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandsService } from "@/discord/_commands/commands.service";
import { formatDate } from "@/_utils/stringUtils";


const data = new SlashCommandBuilder()
.setName('frases')
.setDescription('Mostrar las frases')
.addUserOption(option => option.setName('usuario').setDescription('Usuario a buscar'))
.addIntegerOption(option => option.setName('page').setDescription('Página a mostrar'));


async function execute(interaction, service: CommandsService) {
    if (!interaction.isCommand()) return;
  
    const user = interaction.options.getUser('usuario') || null;
    const page = interaction.options.getInteger('page') || 1;
    const guildId = interaction.guildId;
  
    const { embed, row } = await createEmbed(service, guildId, user?.id, page);
  
    try {
      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error: any) {
      console.error('Error replying to interaction:', error);
    }
  }
  
const MAX_QUOTES = 10
async function createEmbed(service: CommandsService, guildId, userId, page){
    const {totalPages, frases} = await service.getFrases(guildId, userId, page, MAX_QUOTES);
    let fields = [];
    frases.forEach((frase, index) => {
        fields.push({name: (`**"${frase.quote}" **`), value: `*${frase.discordName} - ${formatDate(frase.createdAt)}*`})
    });
    
    const params = frases[0];

    
    const embed = new EmbedBuilder()
    .setColor(`#${params?.color || '0099ff'}`)
    .setAuthor({name: `${userId ? params?.discordName : 'Ficus Quotes'}`, iconURL: `${"https://cdn.discordapp.com/avatars/1170322183646629900/2eed87d0ae9928401f02ddcd10c2e590.webp?size=32"}`})
    .setTimestamp()
    .addFields(fields)
    
    if(userId){
        embed.setTitle(`Frases de ${params?.discordName}`)
    }
    
    let time = new Date().getTime();
    
    const btnFirst = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${userId}:1:${time}a`)
    .setDisabled(page == 1)
    .setEmoji('1179812310534062090')
    
    const btnPrev = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${userId}:${parseInt(page)-1}:${time}b`)
    .setDisabled(page == 1)
    .setEmoji('1179812305530277909')
    
    const btnNext = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${userId}:${parseInt(page)+1}:${time}c`)
    .setDisabled(frases.length < MAX_QUOTES)
    .setEmoji('1179812307073773568')
    
    const btnLast = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${userId}:${totalPages}:${time}d`)
    .setDisabled(frases.length < MAX_QUOTES)
    .setEmoji('1179812309338701835')
    
    const row = new ActionRowBuilder()
        .addComponents(btnFirst, btnPrev, btnNext, btnLast);
    
    return {embed, row};
}

async function handleButton(interaction: ButtonInteraction, service: CommandsService){
    let userId = interaction.customId.split(':')[1];
    if(userId == "undefined") userId = undefined;
    let page = interaction.customId.split(':')[2];

    const {embed, row} = await createEmbed(service, interaction.guildId, userId, page);

    // @ts-ignore
    await interaction.update({embeds: [embed], components: [row]});


    return true;
}


module.exports = {
    data,
    execute,
    handleButton
};










/*

console.log(frase0);



const embed = new EmbedBuilder()
.setColor(`#${frase0?.color}` || '#0099ff')
.setAuthor({name: frase0?.discordName || "Frase Inexistente", iconURL: frase0?.avatar || "https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061131_640.png"})
.setTitle(frase0.quote)
.setTimestamp(frase0.createdAt)

await interaction.reply({ embeds: [embed]});

*/