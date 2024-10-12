import { sql } from "drizzle-orm";
import { datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const wingullInvites = mysqlTable("wingull_invites", {
    id: varchar("id", {length: 6}).primaryKey(),
    uuid: varchar("uuid", { length: 36 }).notNull(),
    username: varchar("username", { length: 32 }).notNull(),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP()`),
    usedAt: datetime("used_at").default(sql`CURRENT_TIMESTAMP()`),
    deletedAt: datetime("deleted_at")
}); 

export type Invite = typeof wingullInvites.$inferSelect;