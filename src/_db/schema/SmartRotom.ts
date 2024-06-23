import { sql } from "drizzle-orm";
import { char, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const smartrotomUsers = mysqlTable("rotom_users", {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    username: varchar("username", { length: 32 }).notNull(),
    world: varchar("world", { length: 8 }),
    energy: int("energy").default(10),
    lastCharge: timestamp("last_charge").default(sql`CURRENT_TIMESTAMP()`),
});

export type SmartRotomUser = typeof smartrotomUsers.$inferSelect;

export const smartrotomApps = mysqlTable("rotom_apps", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull(),
    url: varchar("url", { length: 255 }),
    active: int("active").default(1),
});

export type SmartRotomApp = typeof smartrotomApps.$inferSelect;

export const smartrotomUserApps = mysqlTable("rotom_user_apps", {
    uuid: char("uuid", { length: 36 }),
    appId: int("app_id").notNull(),
    order: int("order").default(999),
});

export type SmartRotomUserApp = typeof smartrotomUserApps.$inferSelect;