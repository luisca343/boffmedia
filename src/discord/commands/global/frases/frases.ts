import { FicusFrase, ficusFrases } from "@/_db/schema/Ficus";
import { MySQL2Service } from "@/_utils/MySQL2Service";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import { eq, or} from 'drizzle-orm';

import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandsService } from "@/discord/_commands/commands.service";
import { formatDate } from "@/_utils/stringUtils";


const data = new SlashCommandBuilder()
.setName('frases')
.setDescription('Mostrar las frases')
.addUserOption(option => option.setName('usuario').setDescription('Usuario a buscar'))
.addIntegerOption(option => option.setName('page').setDescription('Página a mostrar'));

async function autocomplete(interaction, db= null){
    const guildId = interaction.guildId;
    const users = await db.getDrizzle().selectDistinct({userID: ficusFrases.discordId})
    .from(ficusFrases)
    .where(or(
        eq(ficusFrases.serverID, guildId),
        eq(guildId, '516237304101339156')
    ))
    
    const ids = users.map(user => user.userID);
    console.log(ids);
}

async function execute(interaction, service: CommandsService) {
    const user =  interaction.options.getUser('usuario') || null
    const page = interaction.options.getInteger('page') || 1;
    
    const guildId = interaction.guildId;
    const {embed, row} = await createEmbed(service, guildId, user, page);
    
    await interaction.reply({embeds: [embed], components: [row] });
}

const MAX_QUOTES = 10
async function createEmbed(service: CommandsService, guildId, user, page){
    const frases = await service.getFrases(guildId, user?.id, page, MAX_QUOTES);
    
    let fields = [];
    frases.forEach((frase, index) => {
        let fraseValue = `${frase.quote}${user == null ? ` - ${frase.discordName}` : ""}`
        if(index >= (page - 1) * MAX_QUOTES && index < page * MAX_QUOTES){
            fields.push({name: ("#"+(frase.id)), value: `${fraseValue} - ${formatDate(frase.createdAt)}`})
        }
    });
    
    const params = frases[0];
    
    const embed = new EmbedBuilder()
    .setColor(`#${params.color || '#0099ff'}`)
    .setAuthor({name: `${user ? params.discordName : 'Ficus Quotes'}`, iconURL: `${user ? params.avatar : "https://cdn.discordapp.com/avatars/1170322183646629900/2eed87d0ae9928401f02ddcd10c2e590.webp?size=32"}`})
    .setTimestamp()
    .addFields(fields)
    
    if(user){
        embed.setTitle(`Frases de ${params.discordName}`)
    }
    
    let time = new Date().getTime();
    
    const btnFirst = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${user?.id}:1:${time}a`)
    .setDisabled(page == 1)
    .setEmoji('1179812310534062090')
    
    const btnPrev = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${user?.id}:${page-1}:${time}b`)
    .setDisabled(page == 1)
    .setEmoji('1179812305530277909')
    
    const btnNext = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${user?.id}:${page+1}:${time}c`)
    .setDisabled(frases.length < MAX_QUOTES)
    .setEmoji('1179812307073773568')
    
    const btnLast = new ButtonBuilder()
    .setStyle(2)
    .setCustomId(`frases_pagina:${user?.id}:${Math.ceil(frases.length/MAX_QUOTES)}:${time}d`)
    .setDisabled(frases.length < MAX_QUOTES)
    .setEmoji('1179812309338701835')
    
    const row = new ActionRowBuilder()
    .addComponents(btnFirst, btnPrev, btnNext, btnLast);
    
    return {embed, row};
}

module.exports = {
    data,
    autocomplete,
    execute,
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