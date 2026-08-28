import {
  index,
  uniqueIndex,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { jsonColumn } from './_json';

/**
 * Outbox table for transactional side effects (R3 — post-commit side effects are
 * lost silently, and duplicate requests do duplicate work).
 *
 * Producers write a single row INSIDE their business transaction, so a rolled-back
 * change cannot leave a queued side effect. The dispatcher claims due rows atomically
 * (conditional UPDATE stamps ownership), executes the handler, and marks it delivered.
 *
 * Rows that exhaust max attempts stay as `failed` for visibility and debugging,
 * never deleted. The retention service purges delivered rows past the grace period.
 */
export const boffMediaOutbox = mysqlTable(
  'boffmedia_outbox',
  {
    id: int('id').primaryKey().autoincrement(),
    topic: varchar('topic', { length: 100 }).notNull(),
    // `jsonColumn`, not drizzle's `json()`: on MariaDB the latter reads back
    // as a raw string, so every handler's `const { to } = payload` silently
    // produced undefined. See ./_json.ts.
    payload: jsonColumn('payload').$type<Record<string, unknown>>().notNull(),
    /**
     * Optional deduplication key (e.g. `mail:verify:user123`, `wigglypop:order:999`).
     * NULL means "never deduplicate". A unique index on dedupeKey allows multiple NULLs,
     * so callers can choose idempotency per-row. Retried producers pass a key so a
     * second attempt updates the existing row instead of enqueuing a duplicate work item.
     *
     * When a duplicate key is detected (UniqueConstraintViolation), the retry should
     * either wait for the first attempt to complete, or refresh its own outcome from
     * the final row state (e.g. read the sent email ID from another field).
     */
    dedupeKey: varchar('dedupe_key', { length: 255 }),
    attemptCount: int('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at').notNull().defaultNow(),
    status: mysqlEnum('status', ['pending', 'processing', 'delivered', 'failed'])
      .notNull()
      .default('pending'),
    /**
     * Which dispatcher instance currently owns this row. Stamped by the same
     * conditional UPDATE that flips `pending` -> `processing`, so the claim and
     * the ownership mark are one statement. The dispatcher then reads back only
     * the rows carrying its own token: without that, two instances that select
     * the same due ids would both go on to deliver them, which is precisely the
     * double-delivery the claim exists to prevent.
     */
    claimedBy: varchar('claimed_by', { length: 36 }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    deliveredAt: timestamp('delivered_at'),
  },
  (t) => ({
    topicIdx: index('outbox_topic_idx').on(t.topic),
    statusIdx: index('outbox_status_idx').on(t.status),
    nextAttemptIdx: index('outbox_next_attempt_idx').on(t.nextAttemptAt, t.status),
    // uniqueIndex, not index: the whole dedupe contract above depends on the
    // database refusing a second row with the same key. MySQL permits unlimited
    // NULLs in a UNIQUE index, so an unkeyed row is still never deduplicated.
    dedupeUq: uniqueIndex('outbox_dedupe_uq').on(t.dedupeKey),
  }),
);

export type Outbox = typeof boffMediaOutbox.$inferSelect;
export type OutboxInsert = typeof boffMediaOutbox.$inferInsert;
