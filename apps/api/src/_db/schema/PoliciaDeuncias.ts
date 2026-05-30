import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';

export const policiaDenuncias = mysqlTable('policia_denuncias', {
  id: int('id').primaryKey().autoincrement(),
  reporterUuid: char('reporter_uuid', { length: 36 }).notNull(),
  reporterUsername: varchar('reporter_username', { length: 32 }).notNull(),
  accusedUuid: char('accused_uuid', { length: 36 }),
  accusedUsername: varchar('accused_username', { length: 32 }),
  town: varchar('town', { length: 64 }).notNull(),
  plotNumber: int('plot_number'),
  category: mysqlEnum('category', ['griefing', 'theft', 'dispute', 'other'])
    .notNull()
    .default('other'),
  description: text('description').notNull(),
  status: mysqlEnum('status', ['pending', 'reviewing', 'resolved'])
    .notNull()
    .default('pending'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP()`),
  resolvedBy: varchar('resolved_by', { length: 32 }),
  resolvedAt: datetime('resolved_at'),
  notes: text('notes'),
});

export type PoliciaDenuncia = typeof policiaDenuncias.$inferSelect;
export type NewPoliciaDenuncia = typeof policiaDenuncias.$inferInsert;
