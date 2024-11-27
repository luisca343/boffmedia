/*
import { datetime, int, mysqlTable, varchar, text, primaryKey, mysqlEnum, index, foreignKey } from "drizzle-orm/mysql-core";
import { boffMediaUsers } from "./BoffMedia";

export const boffMediaGames = mysqlTable("boffmedia_games", {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }).notNull(),
});

export type Game = typeof boffMediaGames.$inferSelect;

export const boffMediaEvents = mysqlTable("boffmedia_events", {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    game: int("game").references(() => boffMediaGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
    description: text("description"),
    startDate: datetime("start_date").notNull(),
    endDate: datetime("end_date").notNull(),
});

export type Event = typeof boffMediaEvents.$inferSelect;

export const boffMediaEventParticipants = mysqlTable("boffmedia_event_participants", {
    userId: int("user_id").notNull().references(() => boffMediaUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
    eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
    comment: text("comment"),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.eventId] }),
    };
});

export type EventParticipant = typeof boffMediaEventParticipants.$inferSelect;

export const boffMediaAchievements = mysqlTable("boffmedia_achievements", {
    id: int("id").primaryKey().autoincrement(),
    eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }).notNull(),
    target: int("target").notNull().default(1),
    rarity: mysqlEnum("rarity", ["bronze", "silver", "gold", "platinum", "diamond"]).notNull(),
    points: int("points").notNull().default(0),
});

export type Achievement = typeof boffMediaAchievements.$inferSelect;

export const boffMediaAchievementProgress = mysqlTable("boffmedia_achievement_progress", {
    userId: int("user_id").notNull(),
    achievementId: int("achievement_id").notNull(),
    progress: int("progress").notNull().default(0),
  }, (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.achievementId] }),
      achievementIdIdx: index("achievement_id_idx").on(table.achievementId),
      userFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [boffMediaUsers.id],
        name: "bmap_user_fk"
      })
        .onDelete("cascade")
        .onUpdate("cascade"),
      achievementFk: foreignKey({
        columns: [table.achievementId],
        foreignColumns: [boffMediaAchievements.id],
        name: "bmap_achievement_fk"
      })
        .onDelete("cascade")
        .onUpdate("cascade"),
    };
  });

export type AchievementProgress = typeof boffMediaAchievementProgress.$inferSelect;*/