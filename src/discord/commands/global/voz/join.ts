import { SlashCommandBuilder } from "discord.js";
import axios from "axios";
import { createAudioResource, StreamType, joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import { join } from "path";
import { createReadStream } from "fs";
import fs from "fs";

const data = new SlashCommandBuilder()
.setName('join')
.setDescription('Join a voice channel')
.addChannelOption(option => option.setName('channel').setDescription('The channel to join'));

async function execute(interaction) {
    let channel = interaction.options.getChannel('channel');
    if(!channel ){
        if(interaction.member.voice.channel){
            channel = interaction.member.voice.channel;
        } else {
            return interaction.reply('You need to be in a voice channel or specify one to join!');
        }
    }

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    await interaction.reply(`Joined ${channel.name}`);

	let text = "Ficus ha entrao al canal"
    const testURl = `http://api.streamelements.com/kappa/v2/speech?voice=Enrique&text=${text}&key=MAN0PnTqdziKrbwALxsBxciP3TxBsYAH4QDgNF8kI9lFH_Al`
    const audioFolder = join('public', 'audio')

    const url = join(audioFolder, 'test.mp3')

    axios.get(testURl, {
        responseType: 'arraybuffer'
    }).then(({ data }) => {
        const filename = "mp3"
        fs.writeFileSync(url, data)
        console.log(`downloaded ${url} to ${filename}`)

        
        
        let resource = createAudioResource(createReadStream(url));
        
        
        const player = createAudioPlayer();
        connection.subscribe(player)
        player.play(resource)
        
    }).catch(err => {
        console.error(`an error ocurred while downloading ${url}`, err)
    })



    

    
}

module.exports = {
    data,
    execute
};