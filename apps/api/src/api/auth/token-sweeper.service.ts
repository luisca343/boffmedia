import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { TokenSweeperRepository } from './repositories/token-sweeper.repository';

/** How long a consumed device code is kept so a duplicate poll still resolves
 *  to "already redeemed" rather than "unknown code". */
const DEVICE_CODE_GRACE_MS = 60 * 60 * 1000;

/**
 * Deletes single-use credentials — password-reset tokens, email verifications,
 * desktop device codes — once they can no longer be used. The rows are *hashes*
 * of live credentials, so keeping them past expiry is storage no one needs and
 * an audit surface no one wants.
 *
 * Housekeeping only: every read path re-checks expiry and single-use, so nothing
 * depends on this having run. The queries live in `TokenSweeperRepository`; a
 * service never talks to Drizzle directly.
 */
@Injectable()
export class TokenSweeperService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: TokenSweeperRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep(): Promise<void> {
    const now = new Date();
    try {
      await this.repo.deleteSpentPasswordResets(now);
      await this.repo.deleteSpentEmailVerifications(now);
      await this.repo.deleteStaleDeviceCodes(
        new Date(now.getTime() - DEVICE_CODE_GRACE_MS),
      );
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      this.logger.error(`Token sweep failed: ${error?.message}`);
    }
  }
}
