import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { CajaRepository } from './repositories/caja.repository';

/**
 * Returns reservations that were never confirmed and have outlived the TTL to the
 * claimable pool (DARCAJA.md §7). This is housekeeping, not correctness: the
 * repository's `claimable()` predicate already treats an expired reservation as
 * free, so a player is never blocked by a stale hold even if this never ran. The
 * sweep only clears the leftover `reservation_id`/`reserved_at` stamps so the table
 * reflects reality and stale holds are observable.
 */
@Injectable()
export class CajaReservationSweeper {
  constructor(
    private readonly logger: Logger,
    private readonly cajaRepository: CajaRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    try {
      const reclaimed = await this.cajaRepository.sweepExpiredReservations();
      if (reclaimed > 0) {
        this.logger.log(
          `Caja: reclaimed ${reclaimed} expired reservation(s) — an undelivered ` +
            `grant that is now claimable again`,
        );
      }
    } catch (error: any) {
      // Cosmetic sweep — a failure must never crash the scheduler tick.
      this.logger.error(`Caja: reservation sweep failed: ${error?.message}`);
    }
  }
}
