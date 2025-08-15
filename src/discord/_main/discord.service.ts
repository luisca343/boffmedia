import { Injectable, Logger } from '@nestjs/common';
import { Client, IntentsBitField, GatewayIntentBits, ButtonInteraction, Events, ChannelType } from 'discord.js';
import { playAudio } from '../_util/audio';
import { CommandsService } from '../_commands/commands.service';

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);
    private client: Client;

    constructor(private readonly service: CommandsService) {
        this.logger.log('DiscordService instantiated');
        this.connect();
        this.setupInteractionListener();
    }

    connect(): Client {
        if (!this.client) {
            this.client = new Client(
                { 
                    intents: [
                        IntentsBitField.Flags.Guilds, 
                        IntentsBitField.Flags.GuildMembers, 
                        IntentsBitField.Flags.GuildMessages, 
                        IntentsBitField.Flags.MessageContent,
                        IntentsBitField.Flags.GuildPresences,
                        IntentsBitField.Flags.GuildVoiceStates,
                        GatewayIntentBits.Guilds
                    ]
                }
            );
            this.client.login(process.env.DISCORD_KEY);
        }

        return this.client;
    }

    setupInteractionListener() {
        this.client.on(Events.MessageCreate, async message => {
            if (message.author.bot) return;
            if (message.channel.type === ChannelType.DM) return;

            if (message.guild.members.me.voice.channel && message.guild.members.me.voice.channel.id === message.channel.id) {
                playAudio(message, this.service);
            }
        });
    }

    async handleButton(interaction: ButtonInteraction) {
        // Handle button interactions if needed
        try {
            // Custom button handling logic
            await interaction.reply({ content: 'Button interaction handled!', ephemeral: true });
        } catch (error) {
            console.error(`Error executing button interaction: ${interaction.customId}`);
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this interaction!', ephemeral: true });
        }
    }
}