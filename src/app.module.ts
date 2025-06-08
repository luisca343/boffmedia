import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SmartRotomAppsModule } from '@api/smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';
import { InvitesModule } from './wingull/invites/invites.module';
import { UsersModule } from '@api/boffmedia/users/users.module';
import { MySQL2Service } from './_utils/MySQL2Service';
import { ChatController } from '@api/smartrotom/chat/chat.controller';
import { ChatService } from '@api/smartrotom/chat/chat.service';
import { ChatModule } from '@api/smartrotom/chat/chat.module';
import { PokemonController } from '@api/smartrotom/pokemon/pokemon.controller';
import { PokemonModule } from '@api/smartrotom/pokemon/pokemon.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MinaService } from '@api/smartrotom/mine/mine.service';
import { MinaController } from '@api/smartrotom/mine/mine.controller';
import { StarbankController } from '@api/smartrotom/starbank/starbank.controller';
import { StarbankService } from '@api/smartrotom/starbank/starbank.service';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { NetfluisService } from '@api/smartrotom/netfluis/netfluis.service';
import { NetfluisModule } from '@api/smartrotom/netfluis/netfluis.module';
import { MinecraftMiddleware } from './minecraft.middleware';
import { DocumentsModule } from '@api/smartrotom/documents/documents.module';
import { ChatappController } from '@api/smartrotom/chatapp/chatapp.controller';
import { ChatappService } from '@api/smartrotom/chatapp/chatapp.service';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { SocketsModule } from './sockets/sockets.module';
import { MisionesModule } from '@api/smartrotom/misiones/misiones.module';
import { SmartrotomController } from '@api/smartrotom/_main/smartrotom.controller';
import { SmartrotomModule } from '@api/smartrotom/_main/smartrotom.module';
import { BattleService } from './api/battlesimulator/battle/battle.service';
import { BattleController } from './api/battlesimulator/battle/battle.controller';
import { BattleModule } from './api/battlesimulator/battle/battle.module';
import { SharexModule } from './util/sharex/sharex.module';
import { ArcadeModule } from '@api/smartrotom/arcade/arcade.module';
import { ArcadeController } from '@api/smartrotom/arcade/arcade.controller';
import { ArcadeService } from '@api/smartrotom/arcade/arcade.service';
import { PokemonService } from '@api/smartrotom/pokemon/pokemon.service';
import { DiscordService } from './discord/_main/discord.service';
import { DiscordModule } from './discord/_main/discord.module';
import { CommandsService } from './discord/_commands/commands.service';
import { CommandsModule } from './discord/_commands/commands.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';
import { ResponseService } from './response/response.service';
import { ResponseModule } from './response/response.module';
import { LoggerModule } from './logger/logger.module';
import { PtcgpController } from '@api/boffmedia/herramientas/ptcgp/ptcgp.controller';
import { PtcgpModule } from '@api/boffmedia/herramientas/ptcgp/ptcgp.module';
import { ConfigService } from './api/config.service';
import { TgcpCardService } from '@api/boffmedia/herramientas/ptcgp/card.service';
import { TgcpUserCardService } from '@api/boffmedia/herramientas/ptcgp/user-card.service';
import { TgcpPackService } from '@api/boffmedia/herramientas/ptcgp/pack.service';
import { TgcpScraperService } from '@api/boffmedia/herramientas/ptcgp/scraper.service';
import { AuthModule } from './api/auth/auth.module';
import { ShowdownGateway } from './api/battlesimulator/showdown.gateway';
import { PtcgpBattleService } from '@api/boffmedia/herramientas/ptcgp/battle.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { PokemonDataService } from '@api/smartrotom/pokemon/pokemon-data.service';
import { MoveDataService } from '@api/smartrotom/pokemon/move-data.service';
import { SpawnDataService } from '@api/smartrotom/pokemon/spawn-data.service';
import { PokemonImageService } from '@api/smartrotom/pokemon/pokemon-image.service';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';
import { AchievementService } from '@api/smartrotom/achievement/achievement.service';
import { PlayerModule } from '@api/smartrotom/player/player.module';
import { PlayerService } from '@api/smartrotom/player/player.service';
import { RegionModule } from '@api/smartrotom/region/region.module';
import { UsersService } from '@api/boffmedia/users/users.service';
import { SmartrotomService } from '@api/smartrotom/_main/smartrotom.service';
//import { EventsModule } from './boffmedia/events/events.module';
import { EventsController } from '@api/smartrotom/events/events.controller';
import { EventsFacadeService } from '@api/smartrotom/events/events.facade.service';
import { EventsModule } from '@api/smartrotom/events/events.module';
import { UploadController } from './util/upload/upload.controller';
import { UploadModule } from './util/upload/upload.module';
import { MhwildsController } from './api/boffmedia/tools/mhwilds/mhwilds.controller';
import { MhwildsModule } from './api/boffmedia/tools/mhwilds/mhwilds.module';
import { MhwildsService } from './api/boffmedia/tools/mhwilds/mhwilds.service';
import { WingullModule } from '@api/smartrotom/wingull/wingull.module';
import { PokemonShowdownService } from '@api/smartrotom/pokemon/pokemon-showdown.service';
import { SpriteManifestService } from '@api/smartrotom/pokemon/sprite-manifest.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    SmartRotomAppsModule,
    SmartRotomUsersModule,
    UsersModule,
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
    RegionModule,
    UsersModule,
    SmartrotomModule,
    EventsModule,
    UploadModule,
    MhwildsModule,
    WingullModule,
  ],
  controllers: [AppController, ChatController, PokemonController, MinaController, StarbankController, ChatappController, SmartrotomController, BattleController, ArcadeController, PtcgpController, EventsController, UploadController, MhwildsController],
  providers: [AppService, MySQL2Service, ResponseService, ChatService, MinaService, StarbankService, NetfluisService, ChatappService, BattleService, PokemonService, PokemonDataService, MoveDataService, SpawnDataService, PokemonImageService, ArcadeService, DiscordService, CommandsService, 
     TgcpCardService, TgcpUserCardService, TgcpPackService, TgcpScraperService, PtcgpBattleService, ShowdownGateway, AchievementService, BattleService, PlayerService, RegionModule, UsersService, SmartrotomService, PokemonShowdownService, SpriteManifestService,
    {
    provide: ConfigService,
    useClass: ConfigService,
  },
    EventsFacadeService,
    MhwildsService

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