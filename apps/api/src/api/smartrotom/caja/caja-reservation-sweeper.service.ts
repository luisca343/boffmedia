import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { CajaRepository } from './repositories/caja.repository';

/**
 * Periodically clears stamps of unconfirmed reservations past the TTL (DARCAJA.md §7).
 * Housekeeping, not correctness — `claimable()` already treats an expired hold as free,
 * so a player is never blocked even if this never runs; it just keeps the table tidy.
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
        this.logger.log(`Caja: reclaimed ${reclaimed} expired reservation(s)`);
      }
    } catch (error: any) {
      // Cosmetic sweep — a failure must never crash the scheduler tick.
      this.logger.error(`Caja: reservation sweep failed: ${error?.message}`);
    }
  }
}
