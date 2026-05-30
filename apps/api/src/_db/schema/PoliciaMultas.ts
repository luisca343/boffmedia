import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';

export const policiaMultas = mysqlTable('policia_multas', {
  id: int('id').primaryKey().autoincrement(),
  playerUuid: char('player_uuid', { length: 36 }).notNull(),
  playerUsername: varchar('player_username', { length: 32 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  issuedBy: varchar('issued_by', { length: 32 }).notNull(),
  issuedAt: datetime('issued_at').default(sql`CURRENT_TIMESTAMP()`),
  status: mysqlEnum('status', ['pending', 'paid', 'cancelled'])
    .notNull()
    .default('pending'),
  paidAt: datetime('paid_at'),
});

export type PoliciaMulta = typeof policiaMultas.$inferSelect;
export type NewPoliciaMulta = typeof policiaMultas.$inferInsert;
