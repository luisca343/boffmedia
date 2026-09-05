import {
  char,
  date,
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

// Chat history for the in-app assistant. Deliberately NOT soft-deleted: "borrar
// mis mensajes" has to mean the assistant stops seeing them, and the previous
// `deleted_at` was honoured by `countByUuid` alone — every read that actually
// fed the model ignored it, so a cleared conversation kept answering from the
// messages the player thought they had deleted.
export const ficusAiMessages = mysqlTable(
  'rotom_ficusai_messages',
  {
    id: int('id').primaryKey().autoincrement(),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    content: json('content'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // Every read is "the last N messages for this player", newest first.
  (t) => ({
    ownerRecentIdx: index('rotom_ficusai_messages_owner_recent_idx').on(
      t.uuid,
      t.id,
    ),
  }),
);

export type FicusAiMessage = typeof ficusAiMessages.$inferSelect;

/**
 * Daily token usage tracking for FicusAI. One row per user per day.
 * This tracks LLM token consumption against per-user daily budgets.
 *
 * The counting strategy uses a single row per day (upserted on each request)
 * rather than selecting and counting rows — this prevents amplification attacks
 * where a rate limiter that queries all rows becomes slower the more it is flooded.
 */
export const ficusAiUsage = mysqlTable(
  'rotom_ficusai_usage',
  {
    id: int('id').primaryKey().autoincrement(),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    // Date in YYYY-MM-DD format. Combined with uuid, this is unique.
    date: date('date', { mode: 'date' }).notNull(),
    // Input tokens consumed (prompt tokens)
    inputTokens: int('input_tokens').notNull().default(0),
    // Output tokens consumed (response tokens)
    outputTokens: int('output_tokens').notNull().default(0),
    // Total tokens for fast budget checks (avoids arithmetic)
    totalTokens: int('total_tokens').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    // Unique constraint on (uuid, date) for upsert operations
    uniqueUserDateIdx: uniqueIndex('ficusai_usage_user_date_idx').on(
      t.uuid,
      t.date,
    ),
  }),
);

export type FicusAiUsage = typeof ficusAiUsage.$inferSelect;
