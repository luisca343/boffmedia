import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  int,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';

export const policiaPlotHistory = mysqlTable('policia_plot_history', {
  id: int('id').primaryKey().autoincrement(),
  town: varchar('town', { length: 64 }).notNull(),
  plotNumber: int('plot_number').notNull(),
  previousOwnerUuid: char('previous_owner_uuid', { length: 36 }),
  previousOwnerUsername: varchar('previous_owner_username', { length: 32 }),
  newOwnerUuid: char('new_owner_uuid', { length: 36 }),
  newOwnerUsername: varchar('new_owner_username', { length: 32 }),
  changedAt: datetime('changed_at').default(sql`CURRENT_TIMESTAMP()`),
});

export type PoliciaPlotHistory = typeof policiaPlotHistory.$inferSelect;
export type NewPoliciaPlotHistory = typeof policiaPlotHistory.$inferInsert;
