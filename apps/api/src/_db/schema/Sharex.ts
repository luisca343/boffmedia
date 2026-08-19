import {
  char,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const sharexImages = mysqlTable('boffmedia_sharex_images', {
  id: int('id').primaryKey().autoincrement(),
  app: varchar('app', { length: 32 }).notNull(),
  name: char('name', { length: 10 }).notNull(),
  extension: varchar('extension', { length: 4 }).notNull(),
  key: char('key', { length: 32 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type SharexImage = typeof sharexImages.$inferSelect;
