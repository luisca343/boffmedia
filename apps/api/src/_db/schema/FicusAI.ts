import { sql } from 'drizzle-orm';
import { char, int, json, mysqlTable, timestamp } from 'drizzle-orm/mysql-core';

export const ficusMessages = mysqlTable('ficus_messages', {
  uuid: char('uuid', { length: 36 }),
  content: json('content'),
  id: int('id').primaryKey().autoincrement(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP()`),
  deletedAt: timestamp('deleted_at'),
});

export type FicusMensaje = typeof ficusMessages.$inferSelect;
