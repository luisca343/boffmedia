import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SmartRotomAppsModule } from '@api/smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';
import { InvitesModule } from './api/wingull/invites/invites.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { MySQL2Service } from './_utils/MySQL2Service';
import { ChatController } from '@api/smartrotom/chat/chat.controller';
import { ChatService } from '@api/smartrotom/chat/chat.service';
import { ChatModule } from '@api/smartrotom/chat/chat.module';
import { PokemonController } from '@api/smartrotom/pokemon/pokemon.controller';
import { PokemonModule } from '@api/smartrotom/pokemon/pokemon.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MinaController } from '@api/smartrotom/mine/mine.controller';
import { StarbankController } from '@api/smartrotom/starbank/starbank.controller';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { NetfluisService } from '@api/smartrotom/netfluis/netfluis.service';
import { NetfluisModule } from '@api/smartrotom/netfluis/netfluis.module';
import { MinecraftMiddleware } from './minecraft.middleware';
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
import { DiscordService } from './discord/_main/discord.service';
import { DiscordModule } from './discord/_main/discord.module';
import { CommandsService } from './discord/_commands/commands.service';
import { CommandsModule } from './discord/_commands/commands.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';
import { ResponseService } from './api/_utils/response/response.service';
import { ResponseModule } from './api/_utils/response/response.module';
import { LoggerModule } from './api/_utils/logger/logger.module';
import { PtcgpController } from '@api/boffmedia/herramientas/ptcgp/ptcgp.controller';
import { PtcgpModule } from '@api/boffmedia/herramientas/ptcgp/ptcgp.module';
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
import { EventsController } from '@api/smartrotom/events/events.controller';
import { EventsFacadeService } from '@api/smartrotom/events/events.facade.service';
import { EventsModule } from '@api/smartrotom/events/events.module';
import { UploadController } from './api/boffmedia/util/upload/upload.controller';
import { UploadModule } from './api/boffmedia/util/upload/upload.module';
import { MhwildsController } from './api/boffmedia/herramientas/mhwilds/mhwilds.controller';
import { MhwildsModule } from './api/boffmedia/herramientas/mhwilds/mhwilds.module';
import { WingullModule } from '@api/smartrotom/wingull/wingull.module';
import { PokemonShowdownService } from '@api/smartrotom/pokemon/services/pokemon-showdown.service';
import { SpriteManifestService } from '@api/smartrotom/pokemon/services/sprite-manifest.service';
import { MineModule } from '@api/smartrotom/mine/mine.module';

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
    ChatModule,
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
    DiscordModule,
    CommandsModule,
    LigaModule,
    ResponseModule,
    LoggerModule,
    PtcgpModule,
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
    MineModule,
    PokemonModule
  ],
  controllers: [AppController, ChatController, PokemonController, StarbankController, ChatappController, SmartrotomController, BattleController, ArcadeController, PtcgpController, EventsController, UploadController, MhwildsController],
  providers: [AppService, MySQL2Service, ResponseService, ChatService, NetfluisService, BattleService, PokemonDataService, MoveDataService, SpawnDataService, PokemonImageService, DiscordService, CommandsService, 
     ShowdownGateway, BattleService, PlayerService, SmartrotomService, PokemonShowdownService, SpriteManifestService,
    {
    provide: ConfigService,
    useClass: ConfigService,
  },
    EventsFacadeService,

],
  exports: [ConfigService]
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MinecraftMiddleware)
      .forRoutes('/smartrotom/');
  }
}