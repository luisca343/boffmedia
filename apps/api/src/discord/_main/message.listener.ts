import { Injectable, Logger } from '@nestjs/common';
import { Context, ContextOf, On } from 'necord';
import { playAudio } from '../_util/audio';
import { CommandsService } from '../_commands/commands.service';

@Injectable()
export class MessageListener {
  private readonly logger = new Logger(MessageListener.name);

  constructor(private readonly commandsService: CommandsService) {}

  @On('messageCreate')
  public async onMessage(@Context() [message]: ContextOf<'messageCreate'>) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if the message starts with a specific prefix (optional)
    // If you want all messages to be played, remove this check
    //if (!message.content.startsWith('#')) return;

    // Check if the user is in a voice channel
    if (!message.member?.voice?.channel) {
      return;
    }

    const voiceChannel = message.member.voice.channel;

    // Check if the bot is in the same voice channel as the user
    const botMember = message.guild?.members.cache.get(message.client.user.id);
    if (!botMember?.voice?.channel) {
      return;
    }

    if (botMember.voice.channelId !== voiceChannel.id) {
      return;
    }

    try {
      this.logger.log(
        `Playing audio for message: ${message.content} in channel: ${voiceChannel.name}`,
      );
      await playAudio(message, this.commandsService);
    } catch (error) {
      this.logger.error(`Error playing audio: ${(error as Error).message}`, (error as any).stack);
    }
  }
}
