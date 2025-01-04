import { char, customType, datetime, index, int, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";

export const uuid = customType<{ data: string }>({
    dataType() {
      return 'char(36)';
    },
  });

export const boffMediaUsers = mysqlTable("boffmedia_users", {
    id: int("id").primaryKey().autoincrement(),
    username: varchar("username", { length: 32 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    uuid: uuid("uuid").references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    status: varchar("status", { length: 20 }).notNull().default('active'),
    lastLogin: datetime("last_login"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
}, (table) => ({
    emailIdx: index("email_idx").on(table.email),
}));

export type BoffMediaUser = typeof boffMediaUsers.$inferSelect;

export const boffMediaRoles = mysqlTable("boffmedia_roles", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
  });

export type BoffMediaPermission = typeof boffMediaRoles.$inferSelect;

export const boffMediaUserRoles = mysqlTable("boffmedia_user_roles", {
    id: int("id").primaryKey().autoincrement(),
    userId: int("userId").references(() => boffMediaUsers.id, {onDelete: "cascade", onUpdate: "cascade"}),
    roleId: int("roleId").references(() => boffMediaRoles.id, {onDelete: "cascade", onUpdate: "cascade"}),
}, (table) => ({
    userRoleUnique: uniqueIndex("user_role_unique").on(table.userId, table.roleId),
}));

export type BoffMediaUserPermission = typeof boffMediaUserRoles.$inferSelect;