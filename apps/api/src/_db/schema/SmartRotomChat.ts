import { sql } from 'drizzle-orm';
import {
  boolean,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

export const rotomChats = mysqlTable('rotom_chats', {
  id: int('id').primaryKey().autoincrement(),
  type: int('type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp('updated_at'),
});

export type RotomChat = typeof rotomChats.$inferSelect;

export const rotomChatUsers = mysqlTable('rotom_chat_users', {
  chatId: int('chat_id')
    .notNull()
    .references(() => rotomChats.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  pinned: boolean('pinned').notNull().default(false),
  muted: boolean('muted').notNull().default(false),
});

export type RotomChatUser = typeof rotomChatUsers.$inferSelect;

export const rotomChatMessages = mysqlTable('rotom_chat_messages', {
  id: int('id').primaryKey().autoincrement(),
  chatId: int('chat_id')
    .notNull()
    .references(() => rotomChats.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  senderUUID: varchar('sender_uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  content: text('content').notNull(),
  type: varchar('type', { length: 255 }).default('text'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
});

export type RotomChatMessage = typeof rotomChatMessages.$inferSelect;

export const rotomChatMessageReads = mysqlTable(
  'rotom_chat_message_reads',
  {
    messageId: int('message_id')
      .notNull()
      .references(() => rotomChatMessages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: varchar('uuid', { length: 36 })
      .notNull()
      .references(() => smartrotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  // The composite PK is what makes marking a chat read idempotent: the bulk
  // insert relies on ON DUPLICATE KEY to absorb concurrent tabs/retries.
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.uuid] }),
  }),
);

export type RotomChatMessageRead = typeof rotomChatMessageReads.$inferSelect;

export const rotomChatMessageReactions = mysqlTable(
  'rotom_chat_message_reactions',
  {
    messageId: int('message_id')
      .notNull()
      .references(() => rotomChatMessages.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: varchar('uuid', { length: 36 })
      .notNull()
      .references(() => smartrotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    emoji: varchar('emoji', { length: 32 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.uuid, table.emoji] }),
  }),
);

export type RotomChatMessageReaction =
  typeof rotomChatMessageReactions.$inferSelect;
