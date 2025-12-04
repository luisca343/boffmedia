import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SmartRotomAppsModule } from '@api/smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';
import { InvitesModule } from './api/wingull/invites/invites.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { PokemonController } from '@api/smartrotom/pokemon/pokemon.controller';
import { PokemonModule } from '@api/smartrotom/pokemon/pokemon.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StarbankController } from '@api/smartrotom/starbank/starbank.controller';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { NetfluisService } from '@api/smartrotom/netfluis/netfluis.service';
import { NetfluisModule } from '@api/smartrotom/netfluis/netfluis.module';
import { MinecraftMiddleware } from './minecraft.middleware';
import { TimeoutMiddleware } from './_utils/TimeoutMiddleware';
import { DocumentsModule } from '@api/smartrotom/documents/documents.module';
import { ChatappController } from '@api/smartrotom/chatapp/chatapp.controller';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { SocketsModule } from './api/_utils/sockets/sockets.module';
import { MisionesModule } from '@api/smartrotom/misiones/misiones.module';
import { SmartrotomController } from '@api/smartrotom/_main/smartrotom.controller';
import { SmartrotomModule } from '@api/smartrotom/_main/smartrotom.module';
import { BattleService } from './api/battlesimulator/battle/battle.service';
import { BattleController } from './api/battlesimulator/battle/battle.controller';
import { BattleModule } from './api/battlesimulator/battle/battle.module';
import { SharexModule } from './api/boffmedia/util/sharex/sharex.module';
import { ArcadeModule } from '@api/smartrotom/arcade/arcade.module';
import { ArcadeController } from '@api/smartrotom/arcade/arcade.controller';
// import { DiscordService } from './discord/_main/discord.service';
// import { DiscordModule } from './discord/_main/discord.module';
// import { CommandsService } from './discord/_commands/commands.service';
// import { CommandsModule } from './discord/_commands/commands.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';
import { ResponseService } from './api/_utils/response/response.service';
import { ResponseModule } from './api/_utils/response/response.module';
import { LoggerModule } from './api/_utils/logger/logger.module';
import { ConfigService } from './api/config.service';
import { AuthModule } from './api/auth/auth.module';
import { ShowdownGateway } from './api/battlesimulator/showdown.gateway';
import { DrizzleModule } from './api/_utils/drizzle/drizzle.module';
import { PokemonDataService } from '@api/smartrotom/pokemon/services/data/pokemon-data.service';
import { MoveDataService } from '@api/smartrotom/pokemon/services/data/move-data.service';
import { SpawnDataService } from '@api/smartrotom/pokemon/services/data/spawn-data.service';
import { PokemonImageService } from '@api/smartrotom/pokemon/services/data/pokemon-image.service';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';
import { PlayerModule } from '@api/smartrotom/player/player.module';
import { PlayerService } from '@api/smartrotom/player/player.service';
import { SmartrotomService } from '@api/smartrotom/_main/smartrotom.service';
//import { EventsModule } from './boffmedia/events/events.module';
import { EventsController } from '@api/boffmedia/events/events.controller';
import { EventsFacadeService } from '@api/boffmedia/events/events.facade.service';
import { EventsModule } from '@api/boffmedia/events/events.module';
import { UploadController } from './api/boffmedia/util/upload/upload.controller';
import { UploadModule } from './api/boffmedia/util/upload/upload.module';
import { MhwildsController } from './api/boffmedia/herramientas/mhwilds/mhwilds.controller';
import { MhwildsModule } from './api/boffmedia/herramientas/mhwilds/mhwilds.module';
import { WingullModule } from '@api/smartrotom/wingull/wingull.module';
import { PokemonShowdownService } from '@api/smartrotom/pokemon/services/pokemon-showdown.service';
import { SpriteManifestService } from '@api/smartrotom/pokemon/services/sprite-manifest.service';
import { SmartRotomMineModule } from '@api/smartrotom/mine/mine.module';
import { TcgModule } from '@api/boffmedia/herramientas/pokemon/tcgpocket/tcg.module';
import { FicusAIModule } from '@api/smartrotom/ficusai/ficusai.module';
import { AutomationModule } from './automation/automation.module';
import { MySQL2Service } from './_utils/MySQL2Service';
import { WingullSQL2Service } from './_utils/WingullSQL2Service';
import { CircuitBreakerService } from './_utils/CircuitBreakerService';
import { PokemonLogModule } from '@api/boffmedia/util/showdown/pokemon-log.module';
import { YoutubeModule } from '@api/boffmedia/herramientas/youtube/youtube.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
      exclude: ['/api*'],
    }),
    SmartRotomAppsModule,
    SmartRotomUsersModule,
    BoffMediaUsersModule,
    InvitesModule,
    PokemonModule,
    StarbankModule,
    NetfluisModule,
    DocumentsModule,
    ChatappModule,
    SocketsModule,
    MisionesModule,
    SmartrotomModule,
    BattleModule,
    SharexModule,
    ArcadeModule,
    // DiscordModule,
    // CommandsModule,
    LigaModule,
    ResponseModule,
    LoggerModule,
    TcgModule,
    //EventsModule,
    AuthModule,
    DrizzleModule,
    AchievementModule,
    BattleModule,
    PlayerModule,
    SmartrotomModule,
    EventsModule,
    UploadModule,
    MhwildsModule,
    WingullModule,
    SmartRotomMineModule,
    PokemonModule,
    FicusAIModule,
    AutomationModule,
    PokemonLogModule,
    YoutubeModule
  ],
  controllers: [AppController, PokemonController, StarbankController, ChatappController, SmartrotomController, BattleController, ArcadeController, EventsController, UploadController, MhwildsController],
  providers: [AppService, ResponseService, NetfluisService, BattleService, PokemonDataService, MoveDataService, SpawnDataService, PokemonImageService, // CommandsService, 
     ShowdownGateway, BattleService, PlayerService, SmartrotomService, PokemonShowdownService, SpriteManifestService, MySQL2Service, WingullSQL2Service, CircuitBreakerService,
    {
    provide: ConfigService,
    useClass: ConfigService,
  },
    EventsFacadeService,

],
  exports: [ConfigService, CircuitBreakerService]
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TimeoutMiddleware)
      .forRoutes('*');
    
    consumer
      .apply(MinecraftMiddleware)
      .exclude(
        { path: 'smartrotom/starbank/accounts', method: RequestMethod.POST }
      )
      .forRoutes('/smartrotom/');
  }
}