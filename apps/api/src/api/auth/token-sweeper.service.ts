import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { TokenSweeperRepository } from './repositories/token-sweeper.repository';

/** How long a consumed device code is kept so a duplicate poll still resolves
 *  to "already redeemed" rather than "unknown code". */
const DEVICE_CODE_GRACE_MS = 60 * 60 * 1000;

/**
 * Deletes single-use credentials once they can no longer be used.
 *
 * Nothing purged these before: password-reset tokens, email verifications and
 * desktop device codes accumulated forever. `desktop-device.repository` even
 * had a `sweepExpired()`, but the only caller was the poll path, so a code
 * nobody polled for stayed on disk indefinitely. Rows here are the *hashes* of
 * live credentials — keeping them past their expiry is storage no one needs and
 * an audit surface no one wants.
 *
 * Housekeeping only: every read path already re-checks expiry and single-use,
 * so nothing depends on this having run. The queries live in
 * `TokenSweeperRepository` (api-standards.md §Layering — a service never talks
 * to DRIZZLE directly).
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
