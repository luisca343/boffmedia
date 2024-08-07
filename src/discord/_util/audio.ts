import { createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { Client, Message } from "discord.js";
import { PassThrough } from "stream";
import axios from "axios";
import { CommandsService } from "../_commands/commands.service";
import { AudioPlayerStatus } from "@discordjs/voice";

const voiceCache = new Map<string, string>();
const audioQueue = [];

export async function playAudio(message: Message, service: CommandsService) {
    const voiceChannel = message.member.voice.channel;
    
    if (!voiceChannel) {
        return message.channel.send('You need to be in a voice channel to play music!');
    }

    const voice = await getVoice(service, message.author.id) || 'Enrique';
    const audioStream = await downloadAudio(voice, message.content.replace('#','almohadilla'));
    if (!audioStream) {
        return message.channel.send('There was an error downloading the audio');
    }

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    audioQueue.push(audioStream);

    if(audioQueue.length === 1) {
        playAudioElement(connection, audioStream);
    }
}

function playAudioElement(connection, audioStream) {
    const resource = createAudioResource(audioStream);
    const player = createAudioPlayer();

    player.on('stateChange', (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Idle) {
            audioQueue.shift();
            if(audioQueue.length > 0) {
                playAudioElement(connection, audioQueue[0]);
            }
        }
    });

    connection.subscribe(player);
    player.play(resource);
}

export async function downloadAudio(voice: string, text: string) {
    const url = `http://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${text}&key=MAN0PnTqdziKrbwALxsBxciP3TxBsYAH4QDgNF8kI9lFH_Al`;

    try {
        const { data } = await axios.get(url, { responseType: 'stream' });
        const audioStream = new PassThrough();
        data.pipe(audioStream);
        return audioStream;
    } catch (error) {
        console.error(`An error occurred while downloading ${url}`, error);
    }

    return null;
}

export async function getVoices(){
    let url = "https://api.streamelements.com/kappa/v2/speech/voices";
    let response = await axios.get(url);

    const voices = [];

    Object.keys(response.data.voices).forEach((key, id) => {
        let nombre = `[${response.data.voices[key].languageName}] ${key}`
        let voz = { id: id++, value: id++, name: nombre}
        voices.push(voz)
    });

    console.log(voices);
    return voices;
}

export async function getVoiceName(value: number) {
    let url = "https://api.streamelements.com/kappa/v2/speech/voices";
    let response = await axios.get(url);

    const voices = [];

    Object.keys(response.data.voices).forEach((key, id) => {
        let voz = { id: id++, value: id++, name: key}
        voices.push(voz)
    });

    const voice = voices.find(voice => voice.value === value);
    return voice ? voice.name : null;
}

export async function setVoice(service: CommandsService, userId: string, voice: number) {
    await service.setTTSVoice(userId , voice);
    voiceCache.set(userId, await getVoiceName(voice));
}

export async function getVoice(service: CommandsService, userId: string) {
    return voiceCache.get(userId) || await service.getTTSVoice(userId);
}