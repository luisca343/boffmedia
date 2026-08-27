import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

/**
 * The database half of the health check.
 *
 * It exists so `AppService` does not hold a connection handle for the sake of
 * one liveness ping — the ping is a persistence concern, and keeping it here
 * means the health endpoint has no reason to import drizzle at all.
 */
@Injectable()
export class HealthRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database,
  ) {}

  /**
   * Round-trips the cheapest possible statement. Throws whatever the driver
   * throws; the caller turns that into the reported status.
   */
  async ping(): Promise<void> {
    await this.db.execute('SELECT 1');
  }
}
