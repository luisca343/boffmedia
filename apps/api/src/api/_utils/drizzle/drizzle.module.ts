import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

export const DRIZZLE = Symbol('DRIZZLE');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const pool = mysql.createPool({
          host: configService.get<string>('DB_HOST'),
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          port: parseInt(configService.get<string>('DB_PORT') ?? '3306'),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        return drizzle(pool) as MySql2Database;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
