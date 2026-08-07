import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ResponseInterceptor } from './api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from './api/auth/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsMiddleware } from './_utils/metrics/metrics.middleware';
import { SmartRotomAppsModule } from '@api/smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';
import { InvitesModule } from './api/wingull/invites/invites.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { PokemonModule } from '@api/smartrotom/pokemon/pokemon.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { NetfluisModule } from '@api/smartrotom/netfluis/netfluis.module';
import { MinecraftMiddleware } from './minecraft.middleware';
import { DocumentsModule } from '@api/smartrotom/documents/documents.module';
import { ChatappModule } from '@api/smartrotom/chatapp/chatapp.module';
import { SocketsModule } from './api/_utils/sockets/sockets.module';
import { MisionesModule } from '@api/smartrotom/misiones/misiones.module';
import { CajaModule } from '@api/smartrotom/caja/caja.module';
import { SmartrotomModule } from '@api/smartrotom/_main/smartrotom.module';
import { BattleModule } from './api/battlesimulator/battle/battle.module';
import { SharexModule } from './api/boffmedia/util/sharex/sharex.module';
import { ArcadeModule } from '@api/smartrotom/arcade/arcade.module';
import { PcModule } from '@api/smartrotom/pc/pc.module';
import { DiscordModule } from './discord/_main/discord.module';
import { CommandsModule } from './discord/_commands/commands.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';
import { ResponseModule } from './api/_utils/response/response.module';
import { LoggerModule } from './api/_utils/logger/logger.module';
import { ConfigService } from './api/config.service';
import { AuthModule } from './api/auth/auth.module';
import { DrizzleModule } from './api/_utils/drizzle/drizzle.module';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';
import { PlayerModule } from '@api/smartrotom/player/player.module';
import { EventsModule } from '@api/boffmedia/events/events.module';
import { ForumModule } from '@api/boffmedia/forum/forum.module';
import { TournamentsModule } from '@api/boffmedia/tournaments/tournaments.module';
import { NotificationsModule } from '@api/boffmedia/notifications/notifications.module';
import { SuggestionsModule } from '@api/boffmedia/suggestions/suggestions.module';
import { CommunityModule } from '@api/boffmedia/community/community.module';
import { PublicProfileModule } from '@api/boffmedia/public-profile/public-profile.module';
import { UploadModule } from './api/boffmedia/util/upload/upload.module';
import { MhwildsModule } from './api/boffmedia/herramientas/mhwilds/mhwilds.module';
import { WingullModule } from '@api/smartrotom/wingull/wingull.module';
import { SmartRotomMineModule } from '@api/smartrotom/mine/mine.module';
import { SmartRotomDungeonsModule } from '@api/smartrotom/dungeons/dungeons.module';
import { SmartRotomKartsModule } from '@api/smartrotom/karts/karts.module';
import { TcgModule } from '@api/boffmedia/herramientas/pokemon/tcgpocket/tcg.module';
import { FicusAIModule } from '@api/smartrotom/ficusai/ficusai.module';
import { AutomationModule } from './automation/automation.module';
import { PokemonLogModule } from '@api/boffmedia/util/showdown/pokemon-log.module';
import { YoutubeModule } from '@api/boffmedia/herramientas/youtube/youtube.module';
import { ScrapeModule } from '@api/boffmedia/herramientas/scrape/scrape.module';
import { MangaModule } from '@api/boffmedia/herramientas/manga/manga.module';
import { VgcModule } from '@api/boffmedia/herramientas/pokemon/vgc/vgc.module';
import { GobiernoModule } from '@api/smartrotom/gobierno/gobierno.module';
import { RookerModule } from '@api/smartrotom/rooker/rooker.module';
import { PasaporteModule } from '@api/smartrotom/pasaporte/pasaporte.module';
import { WigglypopModule } from '@api/smartrotom/wigglypop/wigglypop.module';
import { TaxiModule } from '@api/smartrotom/taxi/taxi.module';
import { PacksModule } from './api/packs/packs.module';
import { LauncherUpdatesModule } from './api/launcher-updates/launcher-updates.module';
import { RandomizerModule } from '@api/randomizer/randomizer.module';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
    // Rate limiting is available app-wide but only enforced where ThrottlerGuard is
    // applied (auth routes) — a global guard would throttle SSE/tool streams too.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ConfigModule.forRoot(),
    // Kept because PUBLIC_DIR-built URLs (sharex) may point at /public/*.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
      serveStaticOptions: { index: false, maxAge: '1h' },
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
    CajaModule,
    BattleModule,
    SharexModule,
    ArcadeModule,
    PcModule,
    DiscordModule,
    CommandsModule,
    LigaModule,
    ResponseModule,
    LoggerModule,
    TcgModule,
    AuthModule,
    DrizzleModule,
    AchievementModule,
    PlayerModule,
    SmartrotomModule,
    EventsModule,
    ForumModule,
    TournamentsModule,
    NotificationsModule,
    SuggestionsModule,
    CommunityModule,
    PublicProfileModule,
    UploadModule,
    MhwildsModule,
    WingullModule,
    SmartRotomMineModule,
    SmartRotomDungeonsModule,
    SmartRotomKartsModule,
    FicusAIModule,
    AutomationModule,
    PokemonLogModule,
    YoutubeModule,
    ScrapeModule,
    MangaModule,
    VgcModule,
    GobiernoModule,
    RookerModule,
    PasaporteModule,
    WigglypopModule,
    TaxiModule,
    PacksModule,
    LauncherUpdatesModule,
    RandomizerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: ConfigService,
      useClass: ConfigService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Secure-by-default: every route requires a valid JWT unless marked
    // `@Public()`. Runs alongside any per-route @UseGuards (RolesGuard, etc.).
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [ConfigService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
    consumer
      .apply(MinecraftMiddleware)
      .exclude(
        // The mod authenticates with its Bearer token and sends no `server`
        // field, so the tripwire middleware would 403 it before routing.
        { path: 'smartrotom/caja/claim', method: RequestMethod.POST },
        { path: 'smartrotom/caja/reserve', method: RequestMethod.POST },
        { path: 'smartrotom/caja/confirm', method: RequestMethod.POST },
        // Mint/burn route: server Bearer only (GameServerAuthGuard), no `server`
        // field. Must never inherit the public MC_WORLD tripwire.
        { path: 'smartrotom/starbank/set-balance', method: RequestMethod.POST },
        { path: 'smartrotom/starbank/accounts', method: RequestMethod.POST },
        // Editing an account is multipart, so the middleware cannot see a `server` field at all
        // — multer parses the body after it runs. GameOrUserAuthGuard owns this route's auth.
        {
          path: 'smartrotom/starbank/accounts/{*path}',
          method: RequestMethod.PATCH,
        },
        // Server-only money routes owning their own auth
        // (GameServerTransitionalAuthGuard: Bearer, or the tripwire only while
        // ENFORCE_MONEY_AUTH is off). The guard reads `body.server` itself, so
        // the middleware must not also gate them or it would 403 the eventual
        // Bearer-only, no-`server` call.
        { path: 'smartrotom/starbank/shop', method: RequestMethod.POST },
        {
          path: 'smartrotom/starbank/trainerdefeat',
          method: RequestMethod.POST,
        },
        // Money routes guarded by GameOrUserAuthGuard own their own auth (JWT,
        // server key, or transitional tripwire) — the middleware would 403 the
        // JWT-only path that has no `server` in the body.
        { path: 'smartrotom/starbank/transfer', method: RequestMethod.POST },
        {
          path: 'smartrotom/starbank/transfer/from-main',
          method: RequestMethod.POST,
        },
        { path: 'smartrotom/documents/news', method: RequestMethod.POST },
        // `{*path}` not `(.*)`: path-to-regexp v8 throws on unnamed wildcards.
        {
          path: 'smartrotom/documents/news/{*path}',
          method: RequestMethod.PUT,
        },
        {
          path: 'smartrotom/documents/news/{*path}',
          method: RequestMethod.DELETE,
        },
        { path: 'smartrotom/documents/newsstatus', method: RequestMethod.POST },
        // Every write under gobierno/ and wigglypop/ now carries its own guard
        // (roles, or GameOrUserAuthGuard); a JWT caller sends no `server` field.
        { path: 'smartrotom/gobierno/{*path}', method: RequestMethod.POST },
        { path: 'smartrotom/gobierno/{*path}', method: RequestMethod.PATCH },
        { path: 'smartrotom/gobierno/{*path}', method: RequestMethod.PUT },
        { path: 'smartrotom/gobierno/{*path}', method: RequestMethod.DELETE },
        { path: 'smartrotom/wigglypop/{*path}', method: RequestMethod.POST },
        { path: 'smartrotom/wigglypop/{*path}', method: RequestMethod.PATCH },
        { path: 'smartrotom/wigglypop/{*path}', method: RequestMethod.PUT },
        { path: 'smartrotom/wigglypop/{*path}', method: RequestMethod.DELETE },
        // Same reason: the trip route carries GameOrUserAuthGuard, and a JWT caller sends
        // no `server` field.
        { path: 'smartrotom/taxi/{*path}', method: RequestMethod.POST },
      )
      .forRoutes('/smartrotom/');
  }
}
