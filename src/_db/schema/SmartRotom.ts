import { sql } from "drizzle-orm";
import { char, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const smartrotomUsers = mysqlTable("smartrotom_users", {
    uuid: char("uuid", { length: 36 }).notNull().primaryKey(),
    username: varchar("username", { length: 32 }).notNull(),
    world: varchar("world", { length: 8 }),
    energia: int("energia").default(10),
    ultimaRecarga: timestamp("ultima_recarga").default(sql`CURRENT_TIMESTAMP()`),
});

export type SmartRotomUser = typeof smartrotomUsers.$inferSelect;

export const smartrotomApps = mysqlTable("smartrotom_apps", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull(),
    url: varchar("url", { length: 255 }),
    active: int("active").default(1),
});

export type SmartRotomApp = typeof smartrotomApps.$inferSelect;

export const smartrotomUserApps = mysqlTable("smartrotom_user_apps", {
    uuid: char("uuid", { length: 36 }).references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    appId: int("app_id").notNull(),
    order: int("order").default(999),
});

export type SmartRotomUserApp = typeof smartrotomUserApps.$inferSelect;