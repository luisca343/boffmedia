import { sql } from "drizzle-orm";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const rotomChats = mysqlTable("rotom_chats", {
    id: int("id").primaryKey().autoincrement(),
    type: int("type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    image: varchar("image", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export type RotomChat = typeof rotomChats.$inferSelect;

export const rotomChatUsers = mysqlTable("rotom_chat_users", {
    chatId: int("chat_id").notNull(),
    uuid: varchar("uuid", { length: 36 }).notNull(),
});

export type RotomChatUser = typeof rotomChatUsers.$inferSelect;

export const rotomChatMessages = mysqlTable("rotom_chat_messages", {
    id: int("id").primaryKey().autoincrement(),
    chatId: int("chat_id").notNull(),
    senderUUID: varchar("sender_uuid", { length: 36 }).notNull(),
    content: varchar("content", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type RotomChatMessage = typeof rotomChatMessages.$inferSelect;


export const rotomChatMessageReads = mysqlTable("rotom_chat_message_reads", {
    messageId: int("message_id").notNull(),
    uuid: varchar("uuid", { length: 36 }).notNull(),
});

export type RotomChatMessageRead = typeof rotomChatMessageReads.$inferSelect;
