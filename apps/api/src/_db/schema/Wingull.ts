import { char, mysqlTable, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const wingullInvites = mysqlTable('wingull_invites', {
  id: varchar('id', { length: 6 }).primaryKey(),
  uuid: char('uuid', { length: 36 }).notNull(),
  username: varchar('username', { length: 32 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  usedAt: timestamp('used_at'),
  deletedAt: timestamp('deleted_at'),
});

export type Invite = typeof wingullInvites.$inferSelect;
