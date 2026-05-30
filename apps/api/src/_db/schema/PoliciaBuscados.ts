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

export const policiaBuscados = mysqlTable('policia_buscados', {
  id: int('id').primaryKey().autoincrement(),
  playerUuid: char('player_uuid', { length: 36 }).notNull(),
  playerUsername: varchar('player_username', { length: 32 }).notNull(),
  offense: varchar('offense', { length: 255 }).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical'])
    .notNull()
    .default('medium'),
  reportedBy: varchar('reported_by', { length: 32 }).notNull(),
  reportedAt: datetime('reported_at').default(sql`CURRENT_TIMESTAMP()`),
  status: mysqlEnum('status', ['active', 'resolved'])
    .notNull()
    .default('active'),
  notes: text('notes'),
});

export type PoliciaBuscado = typeof policiaBuscados.$inferSelect;
export type NewPoliciaBuscado = typeof policiaBuscados.$inferInsert;
