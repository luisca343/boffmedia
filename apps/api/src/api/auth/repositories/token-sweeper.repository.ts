import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, isNotNull, lt, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaEmailVerifications,
  boffMediaPasswordResetTokens,
  boffMediaRefreshTokens,
} from '@/_db/schema/BoffMediaAuth';
import { desktopDeviceCodes } from '@/_db/schema/DesktopAuth';

/**
 * The delete side of the hourly credential sweep (see `TokenSweeperService`).
 *
 * A row is removable when it has expired OR has already been spent (`used_at` /
 * `consumed_at`), because either makes it unusable. Each method is independent
 * so a failure on one table does not stop the others.
 */
@Injectable()
export class TokenSweeperRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async deleteSpentPasswordResets(now: Date): Promise<void> {
    await this.db
      .delete(boffMediaPasswordResetTokens)
      .where(
        or(
          lt(boffMediaPasswordResetTokens.expiresAt, now),
          isNotNull(boffMediaPasswordResetTokens.usedAt),
        ),
      );
  }

  async deleteSpentEmailVerifications(now: Date): Promise<void> {
    await this.db
      .delete(boffMediaEmailVerifications)
      .where(
        or(
          lt(boffMediaEmailVerifications.expiresAt, now),
          isNotNull(boffMediaEmailVerifications.usedAt),
        ),
      );
  }

  /**
   * `before` is deliberately EARLIER than "now": a consumed device code is kept
   * a little past consumption so a duplicate poll still resolves to "already
   * redeemed" rather than "unknown code".
   */
  async deleteStaleDeviceCodes(before: Date): Promise<void> {
    await this.db
      .delete(desktopDeviceCodes)
      .where(
        or(
          lt(desktopDeviceCodes.expiresAt, before),
          and(
            isNotNull(desktopDeviceCodes.consumedAt),
            lt(desktopDeviceCodes.consumedAt, before),
          ),
        ),
      );
  }

  /**
   * Drop refresh-token ledger rows once their token can no longer be presented.
   *
   * Strictly on `expires_at`, never on `rotated_at`: a SPENT row is exactly what
   * reuse detection needs to still be there when the stolen copy shows up, so
   * deleting rotated rows early would turn a detected theft back into a silent
   * one. Once the JWT itself is expired the verify step rejects it first and the
   * row has no job left.
   */
  async deleteExpiredRefreshTokens(now: Date): Promise<void> {
    await this.db
      .delete(boffMediaRefreshTokens)
      .where(lt(boffMediaRefreshTokens.expiresAt, now));
  }
}
