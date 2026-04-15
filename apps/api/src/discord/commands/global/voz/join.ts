import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { joinVoiceChannel } from '@discordjs/voice';
import { GuildMember, VoiceChannel } from 'discord.js';

@Injectable()
export class JoinCommand {
  @SlashCommand({
    name: 'join',
    description: 'Join a voice channel',
    guilds: ['516237304101339156'],
  })
  public async onJoin(@Context() [interaction]: SlashCommandContext) {
    let channel = interaction.options.getChannel('channel') as VoiceChannel;
    if (!channel) {
      const member = interaction.member as GuildMember;
      if (member.voice.channel) {
        channel = member.voice.channel as VoiceChannel;
      } else {
        return interaction.reply('You need to be in a voice channel or specify one to join!');
      }
    }

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    await interaction.reply(`Joined ${channel.name}`);
  }
}
