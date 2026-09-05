import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { ficusAiUsage } from '@/_db/schema/FicusAI';

/**
 * Data access for FicusAI's per-user daily token budget (A19).
 *
 * Everything is keyed on `(uuid, date)`, which is unique, so every read here is
 * one row and every write is one upsert. That is deliberate for a budget: a
 * limiter that scans a user's rows to add them up gets more expensive the
 * harder it is flooded, which makes it an amplifier rather than a limit — the
 * defect caught on the desktop telemetry ingest endpoint.
 *
 * Only the running total is selected, not the whole row. The caller wants a
 * number; fetching every column to read one of them is the same habit one size
 * smaller.
 */
@Injectable()
export class FicusAiUsageRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /** Tokens this uuid has consumed on `date`, or 0 if it has no row yet. */
  async totalFor(uuid: string, date: Date): Promise<number> {
    const [row] = await this.db
      .select({ totalTokens: ficusAiUsage.totalTokens })
      .from(ficusAiUsage)
      .where(and(eq(ficusAiUsage.uuid, uuid), eq(ficusAiUsage.date, date)))
      .limit(1);

    return row?.totalTokens ?? 0;
  }

  /**
   * Add this request's tokens to the day's running total, creating the row if
   * it is the first request of the day.
   *
   * The increments are SQL expressions rather than a read-then-write, so two
   * concurrent requests from the same user cannot each read the same total and
   * write it back — which would silently discard one request's consumption and
   * let a user exceed the budget by running requests in parallel, the one thing
   * a budget is for.
   */
  async addUsage(
    uuid: string,
    date: Date,
    inputTokens: number,
    outputTokens: number,
  ): Promise<void> {
    const totalTokens = inputTokens + outputTokens;

    await this.db
      .insert(ficusAiUsage)
      .values({ uuid, date, inputTokens, outputTokens, totalTokens })
      .onDuplicateKeyUpdate({
        set: {
          inputTokens: sql`input_tokens + ${inputTokens}`,
          outputTokens: sql`output_tokens + ${outputTokens}`,
          totalTokens: sql`total_tokens + ${totalTokens}`,
          updatedAt: new Date(),
        },
      });
  }
}
