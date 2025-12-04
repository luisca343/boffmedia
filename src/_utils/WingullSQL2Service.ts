import { Injectable } from '@nestjs/common';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';

import * as SmartRotomSchema from '../_db/schema/SmartRotom';

@Injectable()
export class WingullSQL2Service {
  private pool: mysql.Pool;
  private db: MySql2Database<Record<string, never>>;
  private connectionRetries = 0;
  private readonly maxRetries = 3;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.WINGULL_DB_NAME,
        port: parseInt(process.env.DB_PORT),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      this.db = drizzle(this.pool);

      // Test the connection
      await new Promise((resolve, reject) => {
        this.pool.getConnection((err, connection) => {
          if (err) {
            reject(err);
          } else {
            connection.release();
            resolve(true);
          }
        });
      });

      console.log('✅ Wingull database connection established successfully');
      this.isConnected = true;
      this.connectionRetries = 0;
    } catch (error) {
      console.error('❌ Wingull database connection failed:', error.message);
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 Retrying Wingull connection (${this.connectionRetries}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.connect();
      } else {
        throw new Error(`Failed to connect to Wingull database after ${this.maxRetries} attempts`);
      }
    }
  }

  
  smartRotom(){
    return drizzle(this.pool, {schema: SmartRotomSchema, mode: 'default'});
  }

  getConnection(): mysql.Connection {
    return this.pool;
  }

  getDrizzle(): MySql2Database<Record<string, never>> {
    return this.db;
  }

  async migrar() {
    await this.connect();
    migrate(this.db, { migrationsFolder: './drizzle/migrations' }).then(() => {
      console.log("Base de datos migrada");
    }).catch((error) => {
      console.error("Error al migrar base de datos: ", error.message);
      throw error;
    });
  }

  async query<T = unknown>(sql: string, values?: any): Promise<[T, mysql.FieldPacket[]]> {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ Database not connected, attempting reconnection...');
        await this.connect();
      }
      
      if(!values) return await this.pool.execute(sql) as [T, mysql.FieldPacket[]];
      return await this.pool.execute(sql, values) as [T, mysql.FieldPacket[]];
    } catch (error) {
      console.error('❌ Query execution failed:', error.message);
      
      // Try to reconnect on connection errors
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED') {
        console.log('🔄 Attempting to reconnect due to connection error...');
        this.isConnected = false;
        this.connectionRetries = 0;
        await this.connect();
      }
      
      throw new Error('Failed to execute query: ' + error.message); 
    }
  }

  async insertAndReturn<T = unknown>(table: string, sql: string, values?: any): Promise<T[]> {
    try {
      const result = await this.pool.query(sql, values) as mysql.ResultSetHeader[];
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