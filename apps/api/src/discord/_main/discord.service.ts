import { Injectable, Logger } from '@nestjs/common';
import { Client, IntentsBitField, GatewayIntentBits, ButtonInteraction, Events, ChannelType } from 'discord.js';
import { playAudio } from '../_util/audio';
import { CommandsService } from '../_commands/commands.service';
import { ModuleRef } from '@nestjs/core';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);
    private client: Client;
    private commandModules = new Map<string, any>();

    constructor(
        private readonly service: CommandsService,
        private readonly moduleRef: ModuleRef // Inject ModuleRef to resolve providers dynamically
    ) {
        this.logger.log('DiscordService instantiated');
        this.connect();
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
}