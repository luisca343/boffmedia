import { index, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

/**
 * A8 — Distributed lock for the retention sweep via a lease row.
 *
 * Rather than MySQL advisory locks (which are per-connection and break with
 * connection pooling), we use a database row to coordinate exclusive access
 * across instances.
 *
 * Each instance tries to claim the lease with a conditional UPDATE:
 *   - If no row exists, INSERT and own it
 *   - If the row exists and is expired, UPDATE to claim it
 *   - If the row exists and is live, fail (another instance owns it)
 *
 * The lease expires after 90 minutes. If a process crashes, the lease
 * auto-expires and the next instance can claim it.
 */
export const retentionLease = mysqlTable(
  'retention_lease',
  {
    lockName: varchar('lock_name', { length: 64 }).primaryKey(),
    ownerId: varchar('owner_id', { length: 36 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    claimedAt: timestamp('claimed_at').notNull().defaultNow(),
  },
  (t) => ({
    expiresAtIdx: index('retention_lease_expires_idx').on(t.expiresAt),
  }),
);

export type RetentionLease = typeof retentionLease.$inferSelect;
export type RetentionLeaseInsert = typeof retentionLease.$inferInsert;
