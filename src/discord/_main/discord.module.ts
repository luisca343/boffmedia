import { Global, Module } from '@nestjs/common';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ConfigModule } from '@nestjs/config';
import { CommandsModule } from '../_commands/commands.module';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { PingCommand } from '../commands/global/ping';
import { FraseCommand } from '../commands/global/frases/frase';
import { FrasesCommand } from '../commands/global/frases/frases';
import { NuevaFraseCommand } from '../commands/global/frases/nuevafrase';
import { JoinCommand } from '../commands/global/voz/join';
import { SetVozCommand } from '../commands/global/voz/setVoz';

console.log('[DEBUG] Initializing NecordModule with token:', process.env.DISCORD_KEY);

@Global()
@Module({
  imports: [
    ConfigModule,
    NecordModule.forRoot({
      token: process.env.DISCORD_KEY,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildVoiceStates,
      ],
      development: ['516237304101339156'], // Ensure the guild ID is included
    }),
    CommandsModule,
  ],
  controllers: [DiscordController],
  providers: [
    MySQL2Service,
    DiscordService,
    PingCommand,
    FraseCommand,
    FrasesCommand,
    NuevaFraseCommand,
    JoinCommand,
    SetVozCommand,
  ],
})
export class DiscordModule {}
