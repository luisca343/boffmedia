import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const discordQuotes = mysqlTable(
  'discord_quotes',
  {
    id: int('id').primaryKey().autoincrement(),
    discordId: varchar('discord_id', { length: 32 })
      .notNull()
      .references(() => discordUsers.userId, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    serverId: varchar('server_id', { length: 32 }).notNull(),
    quote: text('quote').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // Every Discord command filters by guild, and half of them order by recency.
  (t) => ({
    serverIdx: index('discord_quotes_server_idx').on(t.serverId, t.createdAt),
  }),
);

export type DiscordQuote = typeof discordQuotes.$inferSelect;

export const discordUsers = mysqlTable('discord_users', {
  userId: varchar('user_id', { length: 32 }).notNull().primaryKey(),
  username: varchar('username', { length: 32 }).notNull(),
  avatar: varchar('avatar', { length: 255 }),
  color: varchar('color', { length: 6 }),
  ttsVoice: varchar('tts_voice', { length: 32 }).default('Enrique'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type DiscordUser = typeof discordUsers.$inferSelect;
