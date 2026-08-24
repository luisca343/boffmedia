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
          // Bounded on purpose. `0` is mysql2 for "queue without limit", so an
          // unreachable database used to convert every arriving request into a
          // waiter that could only ever time out: the queue grew for as long as
          // traffic kept coming and the whole API degraded into a latency wall
          // instead of failing. 50 is ~5 waiters per connection; past that a
          // caller is told the truth immediately.
          queueLimit: 50,
          // Explicit rather than inherited. mysql2's default is also 10s, which
          // is a long time to hold a request that will fail — and leaving it
          // implicit means the value silently changes with a driver bump.
          connectTimeout: 10_000,
          // Long-lived pooled sockets die quietly behind NAT, a VPN or a load
          // balancer's idle reaper: the connection stays ESTABLISHED locally
          // while nothing can cross it, and the next query to borrow it hangs
          // rather than reconnecting. Keepalive probes surface the death so the
          // pool can replace the socket.
          enableKeepAlive: true,
          keepAliveInitialDelay: 10_000,
        });

        return drizzle(pool) as MySql2Database;
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
