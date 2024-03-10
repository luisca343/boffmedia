import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SmartRotomAppsModule } from './smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from './smartrotom/users/users.module';
import { InvitesModule } from './wingull/invites/invites.module';
import { UsersModule } from './boffmedia/users/users.module';
import { MySQL2Service } from './MySQL2Service';
import { ChatController } from './smartrotom/chat/chat.controller';
import { ChatService } from './smartrotom/chat/chat.service';
import { ChatModule } from './smartrotom/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    ChatModule
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, MySQL2Service, ChatService],
})
export class AppModule {}