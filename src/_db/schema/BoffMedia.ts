import { char, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";

export const boffMediaUsers = mysqlTable("boffmedia_users", {
    id: int("id").primaryKey().autoincrement(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    uuid: char("uuid", { length: 36 }).references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
});

export type BoffMediaUser = typeof boffMediaUsers.$inferSelect;