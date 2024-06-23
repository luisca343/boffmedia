import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SmartRotomAppsModule } from './smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from './smartrotom/users/users.module';
import { InvitesModule } from './wingull/invites/invites.module';
import { UsersModule } from './boffmedia/users/users.module';
import { MySQL2Service } from './_utils/MySQL2Service';
import { ChatController } from './smartrotom/chat/chat.controller';
import { ChatService } from './smartrotom/chat/chat.service';
import { ChatModule } from './smartrotom/chat/chat.module';
import { PokemonController } from './smartrotom/pokemon/pokemon.controller';
import { PokemonModule } from './smartrotom/pokemon/pokemon.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MinaService } from './smartrotom/mine/mine.service';
import { MinaController } from './smartrotom/mine/mine.controller';
import { StarbankController } from './smartrotom/starbank/starbank.controller';
import { StarbankService } from './smartrotom/starbank/starbank.service';
import { StarbankModule } from './smartrotom/starbank/starbank.module';
import { NetfluisService } from './smartrotom/netfluis/netfluis.service';
import { NetfluisModule } from './smartrotom/netfluis/netfluis.module';
import { MinecraftMiddleware } from './minecraft.middleware';
import { LoggingUtil } from './_utils/LoggingUtils';
import { DocumentsModule } from './smartrotom/documents/documents.module';
import { ChatappController } from './smartrotom/chatapp/chatapp.controller';
import { ChatappService } from './smartrotom/chatapp/chatapp.service';
import { ChatappModule } from './smartrotom/chatapp/chatapp.module';
import { SocketsModule } from './smartrotom/sockets/sockets.module';
import { MisionesModule } from './smartrotom/misiones/misiones.module';
import { SmartrotomController } from './smartrotom/_main/smartrotom.controller';
import { SmartrotomModule } from './smartrotom/_main/smartrotom.module';
import { BattleService } from './battlesimulator/battle/battle.service';
import { BattleController } from './battlesimulator/battle/battle.controller';
import { BattleModule } from './battlesimulator/battle/battle.module';
import { SharexModule } from './sharex/sharex/sharex.module';
import { ArcadeModule } from './smartrotom/arcade/arcade.module';
import { ArcadeController } from './smartrotom/arcade/arcade.controller';
import { ArcadeService } from './smartrotom/arcade/arcade.service';
import { PokemonService } from './smartrotom/pokemon/pokemon.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    //TypeOrmModule.forRoot({
      //type: 'mysql',
      //host: process.env.DB_HOST,
      //port: parseInt(process.env.DB_PORT),
      //username: process.env.DB_USER,
      //password: process.env.DB_PASSWORD,
      //database: process.env.DB_NAME,
      //entities: [App, SmartrotomUser],
      //entities: [__dirname + '/**/*.entity{.ts,.js}'],
      //synchronize: process.env.DB_SYNC === 'true',
    //}),
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
  ],
  controllers: [AppController, ChatController, PokemonController, MinaController, StarbankController, ChatappController, SmartrotomController, BattleController, ArcadeController],
  providers: [AppService, MySQL2Service, ChatService, MinaService, StarbankService, NetfluisService, ChatappService, BattleService, PokemonService, ArcadeService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MinecraftMiddleware)
      .forRoutes('/smartrotom/');
  }
}