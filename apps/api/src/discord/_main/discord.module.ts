import { Global, Module } from '@nestjs/common';
import { env } from '@/config/env';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
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
import { SetVozAutocompleteInterceptor } from '../commands/global/voz/setVoz.interceptor';
import { MessageListener } from './message.listener';
import { VgcMetaModule } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.module';
import { MetaRegulationAutocompleteInterceptor } from '../commands/global/meta/meta-regulation.interceptor';
import { MetaVgcAutocompleteInterceptor } from '../commands/global/meta/meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from '../commands/global/meta/meta-cache.service';
import { MetaPokemonCommand } from '../commands/global/meta/meta-pokemon.command';
import { MetaTopCommand } from '../commands/global/meta/meta-top.command';
import { MetaTeammatesCommand } from '../commands/global/meta/meta-teammates.command';
import { MetaRegulationsCommand } from '../commands/global/meta/meta-regulations.command';
import { MetaCoreCommand } from '../commands/global/meta/meta-core.command';
import { MetaExplainCommand } from '../commands/global/meta/meta-explain.command';
import { MetaAnalyzeCommand } from '../commands/global/meta/meta-analyze.command';
import { MetaMatchupCommand } from '../commands/global/meta/meta-matchup.command';
import { MetaSpeedCommand } from '../commands/global/meta/meta-speed.command';
import { MetaThreatsCommand } from '../commands/global/meta/meta-threats.command';
import { MetaDamageCommand } from '../commands/global/meta/meta-damage.command';

@Global()
@Module({
  imports: [
    ConfigModule,
    VgcMetaModule,
    NecordModule.forRoot({
      token: env.DISCORD_KEY,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildVoiceStates,
      ],
    }),
    CommandsModule,
  ],
  controllers: [DiscordController],
  providers: [
    DiscordService,
    PingCommand,
    FraseCommand,
    FrasesCommand,
    NuevaFraseCommand,
    JoinCommand,
    SetVozCommand,
    SetVozAutocompleteInterceptor,
    MessageListener,
    // VGC meta — shared utilities
    MetaCacheService,
    MetaRegulationAutocompleteInterceptor,
    MetaVgcAutocompleteInterceptor,
    // VGC meta — commands
    MetaPokemonCommand,
    MetaTopCommand,
    MetaTeammatesCommand,
    MetaRegulationsCommand,
    MetaCoreCommand,
    MetaExplainCommand,
    MetaAnalyzeCommand,
    MetaMatchupCommand,
    MetaSpeedCommand,
    MetaThreatsCommand,
    MetaDamageCommand,
  ],
})
export class DiscordModule {}
