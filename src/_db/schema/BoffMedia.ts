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

export const boffMediaRoles = mysqlTable("boffmedia_roles", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull().unique(),
});

export type BoffMediaPermission = typeof boffMediaRoles.$inferSelect;

export const boffMediaUserRoles = mysqlTable("boffmedia_user_roles", {
    id: int("id").primaryKey().autoincrement(),
    userId: int("userId").references(() => boffMediaUsers.id, {onDelete: "cascade", onUpdate: "cascade"}),
    roleId: int("roleId").references(() => boffMediaRoles.id, {onDelete: "cascade", onUpdate: "cascade"}),
});

export type BoffMediaUserPermission = typeof boffMediaUserRoles.$inferSelect;