import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './_utils/metrics/metrics.middleware';
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
import { DocumentsModule } from '@api/smartrotom/documents/documents.module';
import { ChatappController } from '@api/smartrotom/chatapp/chatapp.controller';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { SocketsModule } from './api/_utils/sockets/sockets.module';
import { MisionesModule } from '@api/smartrotom/misiones/misiones.module';
import { SmartrotomController } from '@api/smartrotom/_main/smartrotom.controller';
import { SmartrotomModule } from '@api/smartrotom/_main/smartrotom.module';
import { BattleModule } from './api/battlesimulator/battle/battle.module';
import { SharexModule } from './api/boffmedia/util/sharex/sharex.module';
import { ArcadeModule } from '@api/smartrotom/arcade/arcade.module';
import { ArcadeController } from '@api/smartrotom/arcade/arcade.controller';
import { DiscordModule } from './discord/_main/discord.module';
import { CommandsService } from './discord/_commands/commands.service';
import { CommandsModule } from './discord/_commands/commands.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';
import { ResponseService } from './api/_utils/response/response.service';
import { ResponseModule } from './api/_utils/response/response.module';
import { LoggerModule } from './api/_utils/logger/logger.module';
import { ConfigService } from './api/config.service';
import { AuthModule } from './api/auth/auth.module';
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
import { PokemonLogModule } from '@api/boffmedia/util/showdown/pokemon-log.module';
import { YoutubeModule } from '@api/boffmedia/herramientas/youtube/youtube.module';
import { ScrapeModule } from '@api/boffmedia/herramientas/scrape/scrape.module';
import { MangaModule } from '@api/boffmedia/herramientas/manga/manga.module';
import { VgcModule } from '@api/boffmedia/herramientas/pokemon/vgc/vgc.module';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
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
    BattleModule,
    SharexModule,
    ArcadeModule,
    DiscordModule,
    CommandsModule,
    LigaModule,
    ResponseModule,
    LoggerModule,
    TcgModule,
    //EventsModule,
    AuthModule,
    DrizzleModule,
    AchievementModule,
    PlayerModule,
    SmartrotomModule,
    EventsModule,
    UploadModule,
    MhwildsModule,
    WingullModule,
    SmartRotomMineModule,
    FicusAIModule,
    AutomationModule,
    PokemonLogModule,
    YoutubeModule,
    ScrapeModule,
    MangaModule,
    VgcModule,
  ],
  controllers: [
    AppController,
    PokemonController,
    StarbankController,
    ChatappController,
    SmartrotomController,
    ArcadeController,
    EventsController,
    UploadController,
    MhwildsController,
  ],
  providers: [
    AppService,
    ResponseService,
    NetfluisService,
    PokemonDataService,
    MoveDataService,
    SpawnDataService,
    PokemonImageService,
    CommandsService,
    PlayerService,
    SmartrotomService,
    PokemonShowdownService,
    SpriteManifestService,
    MySQL2Service,
    WingullSQL2Service,
    {
      provide: ConfigService,
      useClass: ConfigService,
    },
    EventsFacadeService,
  ],
  exports: [ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
    consumer
      .apply(MinecraftMiddleware)
      .exclude(
        { path: 'smartrotom/starbank/accounts', method: RequestMethod.POST },
        { path: 'smartrotom/documents/news', method: RequestMethod.POST },
        { path: 'smartrotom/documents/news/(.*)', method: RequestMethod.PUT },
        {
          path: 'smartrotom/documents/news/(.*)',
          method: RequestMethod.DELETE,
        },
        { path: 'smartrotom/documents/newsstatus', method: RequestMethod.POST },
      )
      .forRoutes('/smartrotom/');
  }
}
