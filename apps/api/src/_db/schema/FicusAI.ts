import { sql } from 'drizzle-orm';
import { char, datetime, int, json, mysqlTable } from 'drizzle-orm/mysql-core';

export const ficusMessages = mysqlTable('ficus_messages', {
  uuid: char('uuid', { length: 36 }),
  content: json('content'),
  id: int('id').primaryKey().autoincrement(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP()`),
  deletedAt: datetime('deleted_at'),
});

export type FicusMensaje = typeof ficusMessages.$inferSelect;
