import { sql } from 'drizzle-orm';
import {
  char,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/**
 * The launcher's device-authorization flow.
 *
 * The launcher cannot safely ask for a Boffmedia password, and it has no
 * browser of its own worth trusting with one — so it asks for a short user
 * code, the player approves it on the website where they are already signed in,
 * and the launcher polls until a session appears.
 *
 * Persisted rather than held in memory (unlike the 60-second Mojang challenge):
 * the two halves arrive as separate requests up to ten minutes apart, from two
 * different clients, and an API restart in between must not strand the player
 * on a spinner.
 */
export const launcherDeviceCodes = mysqlTable(
  'launcher_device_codes',
  {
    /** Secret half — only the launcher ever holds it. */
    deviceCode: char('device_code', { length: 64 }).primaryKey(),
    /** Human half — short, unambiguous, typed into the website. */
    userCode: varchar('user_code', { length: 16 }).notNull().unique(),
    /** Set when a user approves. NULL while pending or denied. */
    userId: int('user_id'),
    status: varchar('status', { length: 16 })
      .$type<'pending' | 'approved' | 'denied'>()
      .notNull()
      .default('pending'),
    /** What the launcher told us about itself, for the approval screen. */
    clientLabel: varchar('client_label', { length: 128 }),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    expiresAt: timestamp('expires_at').notNull(),
    /** Set the moment the launcher collects its session, so a code can never be
     *  redeemed twice even if the poll is replayed. */
    consumedAt: timestamp('consumed_at'),
  },
  (table) => ({
    userIdx: index('ldc_user_idx').on(table.userId),
    expiresIdx: index('ldc_expires_idx').on(table.expiresAt),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [boffMediaUsers.id],
      name: 'ldc_user_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type LauncherDeviceCode = typeof launcherDeviceCodes.$inferSelect;
