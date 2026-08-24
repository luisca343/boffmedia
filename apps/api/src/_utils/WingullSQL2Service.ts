import { Injectable } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';
import { Logger } from 'nestjs-pino';

/**
 * Read access to the Wingull game-server database (`WINGULL_DB_NAME`), which is a
 * SEPARATE database from the Boffmedia one and is owned by the Minecraft plugins,
 * not by us. It has no Drizzle schema and no migrations here on purpose: the
 * plugin owns its own tables.
 *
 * This service used to expose `migrar()`, which ran the Boffmedia migration
 * folder against this connection — it would have created all 144 Boffmedia
 * tables inside the game-server database. It was dead code and is gone; nothing
 * in this application may migrate a database it does not own.
 */
@Injectable()
export class WingullSQL2Service {
  private pool: mysql.Pool;

  constructor(private readonly logger: Logger) {
    this.connect();
  }

  private connect(): void {
    this.pool = mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.WINGULL_DB_NAME,
      port: env.DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      // Matches the primary pool in api/_utils/drizzle/drizzle.module.ts. `0`
      // is mysql2 for an UNBOUNDED queue, which turns an unreachable database
      // into a growing backlog of waiters that can only ever time out.
      queueLimit: 50,
      connectTimeout: 10_000,
      // Pooled sockets die quietly behind NAT or an idle reaper: the connection
      // stays ESTABLISHED locally while nothing crosses it, and the next query
      // to borrow it hangs instead of reconnecting.
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
    });
  }

  /**
   * Parameterised read. Throws on failure — it used to `return new Error(...)`,
   * so every caller destructured `[rows]` off an Error and got `undefined`,
   * making a failed query indistinguishable from an empty result.
   */
  async query<T = unknown>(
    sql: string,
    values?: (string | number | boolean | Date | null)[],
  ): Promise<[T, mysql.FieldPacket[]]> {
    try {
      if (!values)
        return (await this.pool.execute(sql)) as [T, mysql.FieldPacket[]];
      return (await this.pool.execute(sql, values)) as [T, mysql.FieldPacket[]];
    } catch (error: any) {
      this.logger.error('Error al ejecutar query en Wingull: ' + error.message);
      throw error;
    }
  }
}
