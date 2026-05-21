import { Injectable } from '@nestjs/common';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/config/env';

@Injectable()
export class DrizzleService {
  private connection: mysql.Pool;

  constructor() {
    this.connect();
  }

  private async connect() {
    this.connection = await mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      port: env.DB_PORT,
    });
  }

  getConnection(): MySql2Database<Record<string, never>> {
    return drizzle(this.connection) as MySql2Database<Record<string, never>>;
  }
}
