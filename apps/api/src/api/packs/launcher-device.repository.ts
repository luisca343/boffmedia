import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  LauncherDeviceCode,
  launcherDeviceCodes,
} from '@/_db/schema/LauncherAuth';

@Injectable()
export class LauncherDeviceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  async create(row: {
    deviceCode: string;
    userCode: string;
    clientLabel: string | null;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(launcherDeviceCodes).values(row);
  }

  async findByDeviceCode(
    deviceCode: string,
  ): Promise<LauncherDeviceCode | undefined> {
    const [row] = await this.db
      .select()
      .from(launcherDeviceCodes)
      .where(eq(launcherDeviceCodes.deviceCode, deviceCode))
      .limit(1);
    return row;
  }

  async findByUserCode(
    userCode: string,
  ): Promise<LauncherDeviceCode | undefined> {
    const [row] = await this.db
      .select()
      .from(launcherDeviceCodes)
      .where(eq(launcherDeviceCodes.userCode, userCode))
      .limit(1);
    return row;
  }

  /**
   * Records the decision, but only on a request that is still pending and still
   * live. Doing the check inside the UPDATE means an expired or already-decided
   * code cannot be flipped by a late click.
   */
  async decide(
    userCode: string,
    status: 'approved' | 'denied',
    userId: number | null,
  ): Promise<boolean> {
    const result = await this.db
      .update(launcherDeviceCodes)
      .set({ status, userId })
      .where(
        and(
          eq(launcherDeviceCodes.userCode, userCode),
          eq(launcherDeviceCodes.status, 'pending'),
          sql`${launcherDeviceCodes.expiresAt} > NOW()`,
        ),
      );
    return result[0].affectedRows > 0;
  }

  /** Burns the code so a replayed poll cannot mint a second session. */
  async consume(deviceCode: string): Promise<boolean> {
    const result = await this.db
      .update(launcherDeviceCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(launcherDeviceCodes.deviceCode, deviceCode),
          eq(launcherDeviceCodes.status, 'approved'),
          isNull(launcherDeviceCodes.consumedAt),
        ),
      );
    return result[0].affectedRows > 0;
  }

  async sweepExpired(): Promise<void> {
    await this.db
      .delete(launcherDeviceCodes)
      .where(lt(launcherDeviceCodes.expiresAt, new Date()));
  }
}
