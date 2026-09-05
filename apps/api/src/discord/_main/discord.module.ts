import { Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DiscordService } from './discord.service';
import { ConfigModule } from '@nestjs/config';
import { CommandsModule } from '../_commands/commands.module';
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
import { DiscordBoundaryInterceptor } from './discord-boundary.interceptor';
import { DiscordHealthListener } from './discord-health.listener';
import { discordGatewayImports, isDiscordBotEnabled } from './discord.config';

/**
 * Everything that only makes sense with a live gateway client. Gated behind the
 * kill switch as one block: with the bot off there is no `Client` for Necord's
 * explorer to bind these to, so registering them would only instantiate 19
 * providers (and their VGC/DB dependencies) to answer nothing.
 */
const GATEWAY_PROVIDERS: Provider[] = [
  PingCommand,
  FraseCommand,
  FrasesCommand,
  NuevaFraseCommand,
  JoinCommand,
  SetVozCommand,
  SetVozAutocompleteInterceptor,
  MessageListener,
  DiscordHealthListener,
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
];

@Global()
@Module({
  imports: [
    ConfigModule,
    VgcMetaModule,
    // Empty when the bot is switched off or has no token — see discord.config.ts.
    ...discordGatewayImports(),
    CommandsModule,
  ],
  // No controllers. `DiscordController` used to sit here with every route
  // commented out — a class that existed only to be registered. A1 removed it:
  // the bot process has no HTTP surface at all, so a controller in this module
  // could not be served from there anyway.
  providers: [
    DiscordService,
    // Declared here rather than in AppModule so the Discord failure boundary
    // stays inside discord/. An APP_INTERCEPTOR is global wherever it is
    // registered, and this one no-ops outside a Necord context.
    { provide: APP_INTERCEPTOR, useClass: DiscordBoundaryInterceptor },
    ...(isDiscordBotEnabled() ? GATEWAY_PROVIDERS : []),
  ],
})
export class DiscordModule {}
