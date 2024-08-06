import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, IntentsBitField, GatewayIntentBits, REST, Routes } from 'discord.js';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DiscordService {
    private client: Client;
    private foldersPath: string;
    private commandFolders: string[];
    private commands: any[] = [];
    private commandModules: Map<string, any> = new Map();

    constructor(private readonly config: ConfigService) {
        const nodeEnv = process.env.NODE_ENV;
        const basePath = nodeEnv === 'production' ? 'dist' : 'src';
        this.foldersPath = path.join(process.cwd(), `${basePath}/discord/commands`);
    
        try {
            this.commandFolders = fs.readdirSync(this.foldersPath);
        } catch (error) {
            console.error('Error reading command folders:', error);
            return;
        }
    
        this.connect();
        this.registerCommands();
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
    


    registerCommands() {
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_KEY);
        for (const folder of this.commandFolders) {
            const commandFiles = fs.readdirSync(`${this.foldersPath}/${folder}`).filter(file => file.endsWith('js'));
            for (const file of commandFiles) {
                const commandModule = require(`${this.foldersPath}/${folder}/${file}`);
                this.commands.push(commandModule.data.toJSON());
                this.commandModules.set(commandModule.data.name, commandModule);
                console.log('Command registered: ', commandModule.data.name);
            }
        }
        console.log('Commands: ', this.commands);
        rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: this.commands })
        .then(() => console.log('Successfully registered commands.'))
        .catch(console.error);
    }

    
    setupInteractionListener() {
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const commandModule = this.commandModules.get(interaction.commandName);
            console.log('Command Module: ', commandModule);

            if (!commandModule) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await commandModule.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        });
    }

    deleteCommands() {
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_KEY);
        rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: [] })
        .then(() => console.log('Successfully deleted commands.'))
        .catch(console.error);

        /*
        const rest2 = new REST({ version: '9' }).setToken(process.env.DISCORD_KEY);
        for (const guild of guilds) {
            rest2.put(Routes.applicationGuildCommands(process.env.DISCORD_ID, guild), { body: [] })
            .then(() => console.log('Successfully deleted guild commands.'))
            .catch(console.error);
        }*/
    }
    
}
//const guilds = ['516237304101339156', '973678603264983050', '1013854725696929912']