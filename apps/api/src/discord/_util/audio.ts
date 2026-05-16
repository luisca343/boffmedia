import {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  AudioPlayerStatus,
  StreamType,
  VoiceConnection,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { Message } from 'discord.js';
import { Readable } from 'stream';
import axios from 'axios';
import { CommandsService } from '../_commands/commands.service';

const voiceCache = new Map<string, string>();

interface QueueEntry {
  connection: VoiceConnection;
  buffer: Buffer;
}

const audioQueue: QueueEntry[] = [];

export async function playAudio(message: Message, service: CommandsService) {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    const channel = message.channel as any;
    return channel.send('You need to be in a voice channel to play music!');
  }

  const voice = (await getVoice(service, message.author.id)) || 'Enrique';
  const buffer = await downloadAudio(
    voice,
    message.content.replace('#', 'almohadilla'),
  );

  if (!buffer) {
    const channel = message.channel as any;
    return channel.send('There was an error downloading the audio');
  }

  const connection = getVoiceConnection(voiceChannel.guild.id);

  if (!connection) {
    console.error(
      'No active voice connection for guild',
      voiceChannel.guild.id,
    );
    return;
  }

  audioQueue.push({ connection, buffer });

  if (audioQueue.length === 1) {
    playNext();
  }
}

function playNext() {
  if (audioQueue.length === 0) return;

  const { connection, buffer } = audioQueue[0];

  const resource = createAudioResource(Readable.from(buffer), {
    inputType: StreamType.Arbitrary,
  });

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });

  player.on('stateChange', (_, newState) => {
    if (newState.status === AudioPlayerStatus.Idle) {
      audioQueue.shift();
      playNext();
    }
  });

  player.on('error', (err) =>
    console.error('Audio player error:', err.message, err),
  );

  connection.subscribe(player);
  player.play(resource);
}

export async function downloadAudio(
  voice: string,
  text: string,
): Promise<Buffer | null> {
  const key = process.env.STREAMELEMENTS_KEY;
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}&key=${key}`;

  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    return Buffer.from(response.data);
  } catch (error: any) {
    const err = error as any;
    console.error(
      'Error downloading audio:',
      err.response?.status,
      err.message,
    );
    return null;
  }
}

export async function getVoices() {
  const url = 'https://api.streamelements.com/kappa/v2/speech/voices';
  const response = await axios.get(url);

  const voices = [];
  Object.keys(response.data.voices).forEach((key, id) => {
    const nombre = `[${response.data.voices[key].languageName}] ${key}`;
    voices.push({ id: id++, value: id++, name: nombre });
  });
  return voices;
}

export async function getVoiceName(value: number): Promise<string | null> {
  const url = 'https://api.streamelements.com/kappa/v2/speech/voices';
  const response = await axios.get(url);

  const voices = [];
  Object.keys(response.data.voices).forEach((key, id) => {
    voices.push({ id: id++, value: id++, name: key });
  });

  const voice = voices.find((v) => v.value === value);
  return voice ? voice.name : null;
}

export async function setVoice(
  service: CommandsService,
  userId: string,
  voice: number,
) {
  await service.setTTSVoice(userId, voice);
  voiceCache.set(userId, await getVoiceName(voice));
}

export async function getVoice(
  service: CommandsService,
  userId: string,
): Promise<string | null> {
  return voiceCache.get(userId) || (await service.getTTSVoice(userId));
}
