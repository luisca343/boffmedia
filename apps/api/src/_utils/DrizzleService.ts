import { Injectable } from '@nestjs/common';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

@Injectable()
export class DrizzleService {
  private connection: mysql.Pool;

  constructor() {
    this.connect();
  }

  private async connect() {
    this.connection = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
    });
  }

  getConnection(): MySql2Database<Record<string, never>> {
    return drizzle(this.connection) as MySql2Database<Record<string, never>>;
  }
}
