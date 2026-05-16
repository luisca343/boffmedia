import { sql } from 'drizzle-orm';
import {
  datetime,
  int,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';

export const ficusFrases = mysqlTable('ficus_quotes', {
  id: int('id').primaryKey().autoincrement(),
  discordId: varchar('discord_id', { length: 32 })
    .notNull()
    .references(() => discordUsers.userId, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  serverID: varchar('server_id', { length: 32 }).notNull(),
  quote: text('quote').notNull(),
  comment: text('comment'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime('updated_at'),
});

export type FicusFrase = typeof ficusFrases.$inferSelect;

export const discordUsers = mysqlTable('discord_users', {
  userId: varchar('user_id', { length: 32 }).notNull().primaryKey(),
  username: varchar('username', { length: 32 }).notNull(),
  avatar: varchar('avatar', { length: 255 }),
  color: varchar('color', { length: 6 }),
  ttsVoice: varchar('tts_voice', { length: 32 }).default('Enrique'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime('updated_at'),
});

export type DiscordUser = typeof discordUsers.$inferSelect;
