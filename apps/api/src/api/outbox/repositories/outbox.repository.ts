import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaOutbox,
  type OutboxInsert,
  type Outbox,
} from '@/_db/schema/BoffMediaOutbox';

@Injectable()
export class OutboxRepository {
  private readonly MAX_ATTEMPTS = 5;
  private readonly BACKOFF_MS = [1000, 5000, 30000, 300000, 3600000]; // 1s, 5s, 30s, 5m, 1h

  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Enqueue a side effect INSIDE the caller's transaction, so a rolled-back
   * business change cannot leave a queued effect orphaned.
   *
   * Usage:
   *   await db.transaction(async (tx) => {
   *     await updateTournamentStatus(..., tx);
   *     await outboxRepository.enqueueTx(tx, 'tournament:announce', {...}, 'announce:123');
   *   });
   *
   * If `dedupeKey` is provided and a row with that key already exists, the INSERT
   * raises a unique constraint violation. The caller (or a retry mechanism) must
   * handle this — either wait for the first attempt to complete, or read the final
   * outcome from a side table once delivered.
   */
  async enqueueTx(
    tx: MySql2Database<Record<string, never>>,
    topic: string,
    payload: Record<string, unknown>,
    dedupeKey?: string,
  ): Promise<number> {
    const [result] = await tx
      .insert(boffMediaOutbox)
      .values({
        topic,
        payload,
        dedupeKey: dedupeKey ?? null,
        status: 'pending',
      });
    return result.insertId;
  }

  /**
   * Enqueue a side effect outside a transaction. Best used for post-commit
   * side effects that can be dispatched asynchronously. The enqueue itself
   * is wrapped in a transaction for safety.
   */
  async enqueue(
    topic: string,
    payload: Record<string, unknown>,
    dedupeKey?: string,
  ): Promise<number> {
    const [result] = await this.db
      .insert(boffMediaOutbox)
      .values({
        topic,
        payload,
        dedupeKey: dedupeKey ?? null,
        status: 'pending',
      });
    return result.insertId;
  }

  /**
   * Atomically claim up to `batchSize` pending rows due for delivery, stamping
   * them as `processing` so a concurrent dispatcher cannot both pick the same row.
   * Returns the claimed rows.
   *
   * The claim uses a conditional UPDATE (same pattern as tournaments' claimSettlement):
   * only rows with status='pending' and nextAttemptAt <= now are claimed and flipped
   * to 'processing' in one atomic step.
   */
  /**
   * Take ownership of up to `batchSize` due rows and return exactly those.
   *
   * The UPDATE is the claim: it flips `pending` -> `processing` and stamps this
   * dispatcher's token in one statement, so only one instance can win a given
   * row. The read back then filters on that token.
   *
   * Filtering on the token is the part that matters. An earlier version
   * selected candidate ids, ran the conditional UPDATE, and then re-read *all*
   * the candidate ids — so a second instance that had selected the same ids
   * returned them too, even though its UPDATE had changed nothing, and both
   * delivered the same side effect.
   */
  async claim(batchSize: number): Promise<Outbox[]> {
    const token = randomUUID();

    const dueIds = await this.db
      .select({ id: boffMediaOutbox.id })
      .from(boffMediaOutbox)
      .where(
        and(
          eq(boffMediaOutbox.status, 'pending'),
          lt(boffMediaOutbox.nextAttemptAt, new Date()),
        ),
      )
      .limit(batchSize);

    if (dueIds.length === 0) return [];

    await this.db
      .update(boffMediaOutbox)
      .set({ status: 'processing', claimedBy: token })
      .where(
        and(
          inArray(
            boffMediaOutbox.id,
            dueIds.map((row) => row.id),
          ),
          // Re-checked inside the write: the candidate list above is a stale
          // read, and this is what makes the claim exclusive.
          eq(boffMediaOutbox.status, 'pending'),
        ),
      );

    return this.db
      .select()
      .from(boffMediaOutbox)
      .where(eq(boffMediaOutbox.claimedBy, token));
  }

  /**
   * Mark a row as successfully delivered. Once delivered, it remains visible
   * in the table for audit purposes and is eventually purged by the retention
   * job after its grace period.
   */
  async markDelivered(id: number): Promise<void> {
    await this.db
      .update(boffMediaOutbox)
      .set({
        status: 'delivered',
        deliveredAt: new Date(),
        attemptCount: sql`${boffMediaOutbox.attemptCount} + 1`,
      })
      .where(eq(boffMediaOutbox.id, id));
  }

  /**
   * Mark a row as failed after an error. Increments attemptCount and sets
   * nextAttemptAt using exponential backoff. Once attempts are exhausted,
   * status is set to 'failed' and nextAttemptAt is not updated (so it stays
   * in 'failed' state indefinitely for debugging, until retention purges it).
   */
  async markFailed(id: number, error: Error): Promise<void> {
    const [row] = await this.db
      .select()
      .from(boffMediaOutbox)
      .where(eq(boffMediaOutbox.id, id))
      .limit(1);

    if (!row) return;

    const nextAttempt = row.attemptCount + 1;
    const isExhausted = nextAttempt >= this.MAX_ATTEMPTS;

    if (isExhausted) {
      // Exhausted: stay in failed state for visibility
      await this.db
        .update(boffMediaOutbox)
        .set({
          status: 'failed',
          attemptCount: nextAttempt,
          lastError: error.message,
        })
        .where(eq(boffMediaOutbox.id, id));
    } else {
      // Retry with exponential backoff
      const backoffMs = this.BACKOFF_MS[nextAttempt - 1] || 3600000;
      const nextAttemptAt = new Date(Date.now() + backoffMs);
      await this.db
        .update(boffMediaOutbox)
        .set({
          status: 'pending',
          attemptCount: nextAttempt,
          lastError: error.message,
          nextAttemptAt,
        })
        .where(eq(boffMediaOutbox.id, id));
    }
  }
}
