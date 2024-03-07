import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SmartRotomAppsModule } from './smartrotom/apps/apps.module';
import { SmartRotomUsersModule } from './smartrotom/users/users.module';
import { InvitesModule } from './wingull/invites/invites.module';
import { UsersModule } from './boffmedia/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      //entities: [App, SmartrotomUser],
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNC === 'true',
    }),
    SmartRotomAppsModule,
    SmartRotomUsersModule,
    UsersModule,
    InvitesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}