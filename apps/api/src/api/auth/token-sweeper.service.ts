import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { lt, or, isNotNull, and } from 'drizzle-orm';
import { Logger } from 'nestjs-pino';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaEmailVerifications,
  boffMediaPasswordResetTokens,
} from '@/_db/schema/BoffMediaAuth';
import { launcherDeviceCodes } from '@/_db/schema/LauncherAuth';

/**
 * Deletes single-use credentials once they can no longer be used.
 *
 * Nothing purged these before: password-reset tokens, email verifications and
 * launcher device codes accumulated forever. `launcher-device.repository` even
 * had a `sweepExpired()`, but the only caller was the poll path, so a code
 * nobody polled for stayed on disk indefinitely. Rows here are the *hashes* of
 * live credentials — keeping them past their expiry is storage no one needs and
 * an audit surface no one wants.
 *
 * A row is removable when it has expired OR has already been spent (`used_at` /
 * `consumed_at`), because both make it unusable. Housekeeping only: every read
 * path already re-checks expiry and single-use, so nothing depends on this
 * having run.
 */
@Injectable()
export class TokenSweeperService {
  constructor(
    private readonly logger: Logger,
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep(): Promise<void> {
    const now = new Date();
    try {
      await this.db
        .delete(boffMediaPasswordResetTokens)
        .where(
          or(
            lt(boffMediaPasswordResetTokens.expiresAt, now),
            isNotNull(boffMediaPasswordResetTokens.usedAt),
          ),
        );

      await this.db
        .delete(boffMediaEmailVerifications)
        .where(
          or(
            lt(boffMediaEmailVerifications.expiresAt, now),
            isNotNull(boffMediaEmailVerifications.usedAt),
          ),
        );

      // Device codes are kept a little past consumption so a duplicate poll
      // still resolves to "already redeemed" rather than "unknown code".
      const staleDeviceCodes = new Date(now.getTime() - 60 * 60 * 1000);
      await this.db
        .delete(launcherDeviceCodes)
        .where(
          or(
            lt(launcherDeviceCodes.expiresAt, staleDeviceCodes),
            and(
              isNotNull(launcherDeviceCodes.consumedAt),
              lt(launcherDeviceCodes.consumedAt, staleDeviceCodes),
            ),
          ),
        );
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      this.logger.error(`Token sweep failed: ${error?.message}`);
    }
  }
}
