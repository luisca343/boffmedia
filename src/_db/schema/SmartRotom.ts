import { sql } from "drizzle-orm";
import { char, datetime, int, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const smartrotomUsers = mysqlTable("rotom_users", {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().unique(),
    username: varchar("username", { length: 32 }).notNull(),
    world: varchar("world", { length: 36 }),
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
    uuid: char("uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    appId: int("app_id").notNull().references(() => smartrotomApps.id, {onDelete: "cascade", onUpdate: "cascade"}),
    order: int("order").default(999),
});

export type SmartRotomUserApp = typeof smartrotomUserApps.$inferSelect;

export const smartRotomAchievements = mysqlTable("rotom_achievements", {
    id: varchar("id", { length: 32 }).primaryKey(),
    name: varchar("name", { length: 64 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    icon: varchar("icon", { length: 255 }),
    category: varchar("category", { length: 32 }).notNull(),
    subcategory: varchar("subcategory", { length: 32 }),
    target: int("target").default(1),
    order: int("order").default(0),
});

export type SmartRotomAchievement = typeof smartRotomAchievements.$inferSelect;

export const smartRotomUserAchievements = mysqlTable("rotom_user_achievements", {
    achievementId: varchar("achievement_id", { length: 32 }).notNull().references(() => smartRotomAchievements.id, {onDelete: "cascade", onUpdate: "cascade"}),
    uuid: char("uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    progress: int("progress").default(0),
    completed: int("completed").default(0),
    completedAt: timestamp("completed_at"),
    dataId: int("data_id").default(0),
}, (table) => {
    return {
        pk: primaryKey({columns: [table.achievementId, table.uuid]}),
    }
});

export type SmartRotomUserAchievement = typeof smartRotomUserAchievements.$inferSelect;

export const smartRotomReplays = mysqlTable("rotom_replays", {
    id: int("id").primaryKey().autoincrement(),
    side1: varchar("side1", { length: 36 }).notNull(),
    side2: varchar("side2", { length: 36 }).notNull(),
    team1: text("team1"),
    team2: text("team2"),
    replay: text("replay").notNull(),
    winner: varchar("winner", { length: 36 }),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`),
});

export type SmartRotomReplay = typeof smartRotomReplays.$inferSelect;

export const smartRotomUserReplays = mysqlTable("rotom_user_replays", {
    uuid: char("uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    replayId: int("replay_id").notNull().references(() => smartRotomReplays.id, {onDelete: "cascade", onUpdate: "cascade"}),
    side: int("side").default(1),
}, (table) => {
    return {
        pk: primaryKey({columns: [table.uuid, table.replayId]}),
    }
});

export type SmartRotomUserReplay = typeof smartRotomUserReplays.$inferSelect;

export const smartRotomArceuSpeak = mysqlTable("rotom_arceuspeak", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull(),
    value: varchar("value", { length: 32 }).notNull(),
    format: varchar("format", { length: 32 }).notNull(),
});

export type SmartRotomArceuSpeak = typeof smartRotomArceuSpeak.$inferSelect;

export const smartRotomArcadeStreaks = mysqlTable('rotom_arcade_streaks', {
    id: int('id').primaryKey().autoincrement(),
    uuid: varchar('uuid', { length: 36 }).notNull(),
    lastClaimed: timestamp('last_claimed'),
    lastBanner: varchar("last_banner", { length: 100 }),
    streak: int('streak').default(0),
    totalClaims: int('total_claims').default(0),
  });

export type SmartRotomArcadeStreak = typeof smartRotomArcadeStreaks.$inferSelect;

export const smartRotomInventory = mysqlTable("rotom_inventory", {
    id: int("id").primaryKey().autoincrement(),
    uuid: char("uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    itemId: varchar("item_id", { length: 32 }).notNull(),
    itemType: varchar("item_type", { length: 32 }).notNull(),
    amount: int("amount").default(1),
    sourceType: varchar("source_type", { length: 32 }),
    used: int("used").default(0),
    rarity: varchar("rarity", { length: 20 }).default("common"),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP()`),
});

export type SmartRotomInventoryItem = typeof smartRotomInventory.$inferSelect;