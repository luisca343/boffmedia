import { Injectable } from '@nestjs/common';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

/**
 * Legacy Drizzle handle kept for the two call sites that predate `DrizzleModule`
 * (ShareX and the Discord command service). New code injects the `DRIZZLE`
 * token instead — that is the pool the rest of the API shares, and a transaction
 * opened on one pool cannot include work done on the other.
 *
 * This service used to expose `migrar()` (which never awaited the migration it
 * started), a raw `query()` that returned an Error object instead of throwing,
 * an unused `insertAndReturn()` that assumed every table has an `id`, and a
 * second `connect()` call that leaked the pool built in the constructor. All of
 * that is gone; what remains is the handle its two consumers actually use.
 */
@Injectable()
export class MySQL2Service {
  private pool: mysql.Pool;
  private db: MySql2Database<Record<string, never>>;

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.pool = mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
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

    this.db = drizzle(this.pool);
  }

  getDrizzle(): MySql2Database<Record<string, never>> {
    return this.db;
  }
}
