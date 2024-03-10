import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class MySQL2Service {
  private connection: mysql.Connection;

  constructor() {
    this.connect();
  }

  private async connect() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
    });
  }

  getConnection(): mysql.Connection {
    return this.connection;
  }

  async query<T = unknown>(sql: string, values?: any): Promise<[T, mysql.FieldPacket[]]> {
    try {
      if(!values) return await this.connection.execute(sql) as [T, mysql.FieldPacket[]];
      return await this.connection.execute(sql, values) as [T, mysql.FieldPacket[]];
    } catch (error) {
      return new Error('Failed to execute query: ' + error.message) as any; 
    }
  }

  async insertAndReturn<T = unknown>(table: string, sql: string, values?: any): Promise<T[]> {
    try {
      const result = await this.connection.query(sql, values) as mysql.ResultSetHeader[];
      const ids = result.map(row => row?.insertId).filter(id => id !== undefined);
  
      if (ids.length === 0) {
        throw new Error('No rows were inserted.');
      }
  
      const [rows, fields] = await this.query<mysql.RowDataPacket[]>(`SELECT * FROM ?? WHERE id IN (?)`, [table, ids]);
  
      return rows as T[];
    } catch (error) {
      console.error("Error al insertar y retornar ", error.message);
      throw error; // re-throw the error to be handled by the calling code
    }
  }
}