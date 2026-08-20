import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  DesktopDeviceCode,
  desktopDeviceCodes,
} from '@/_db/schema/DesktopAuth';

@Injectable()
export class DesktopDeviceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  async create(row: {
    deviceCode: string;
    userCode: string;
    clientLabel: string | null;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(desktopDeviceCodes).values(row);
  }

  async findByDeviceCode(
    deviceCode: string,
  ): Promise<DesktopDeviceCode | undefined> {
    const [row] = await this.db
      .select()
      .from(desktopDeviceCodes)
      .where(eq(desktopDeviceCodes.deviceCode, deviceCode))
      .limit(1);
    return row;
  }

  async findByUserCode(
    userCode: string,
  ): Promise<DesktopDeviceCode | undefined> {
    const [row] = await this.db
      .select()
      .from(desktopDeviceCodes)
      .where(eq(desktopDeviceCodes.userCode, userCode))
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
      .update(desktopDeviceCodes)
      .set({ status, userId })
      .where(
        and(
          eq(desktopDeviceCodes.userCode, userCode),
          eq(desktopDeviceCodes.status, 'pending'),
          sql`${desktopDeviceCodes.expiresAt} > NOW()`,
        ),
      );
    return result[0].affectedRows > 0;
  }

  /** Burns the code so a replayed poll cannot mint a second session. */
  async consume(deviceCode: string): Promise<boolean> {
    const result = await this.db
      .update(desktopDeviceCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(desktopDeviceCodes.deviceCode, deviceCode),
          eq(desktopDeviceCodes.status, 'approved'),
          isNull(desktopDeviceCodes.consumedAt),
        ),
      );
    return result[0].affectedRows > 0;
  }

  async sweepExpired(): Promise<void> {
    await this.db
      .delete(desktopDeviceCodes)
      .where(lt(desktopDeviceCodes.expiresAt, new Date()));
  }
}
