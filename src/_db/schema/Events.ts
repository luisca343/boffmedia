import { datetime, int, mysqlTable, varchar, text, primaryKey, mysqlEnum, index, foreignKey } from "drizzle-orm/mysql-core";
import { boffMediaUsers } from "./BoffMedia";
import { sql } from "drizzle-orm";

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
  icon: varchar("icon", { length: 255 }).notNull(),
  banner: varchar("banner", { length: 255 }),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  type: mysqlEnum("type", ["event", "server"]).notNull(),
});

export type Event = typeof boffMediaEvents.$inferSelect;

export const boffMediaEventTeams = mysqlTable("boffmedia_event_teams", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  tag: varchar("tag", { length: 10 }), // Short team tag/code
  icon: varchar("icon", { length: 255 }),
  leaderId: int("leader_id").references(() => boffMediaUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  totalScore: int("total_score").notNull().default(0),
});

export type EventTeam = typeof boffMediaEventTeams.$inferSelect;

// New table for team members
export const boffMediaEventTeamMembers = mysqlTable("boffmedia_event_team_members", {
  teamId: int("team_id").references(() => boffMediaEventTeams.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: int("user_id").references(() => boffMediaUsers.id, { onDelete: "cascade", onUpdate: "cascade" }),
  role: mysqlEnum("role", ["leader", "member"]).notNull().default("member"),
  joinedAt: datetime("joined_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
      pk: primaryKey({ columns: [table.teamId, table.userId] }),
  };
});

export type EventTeamMember = typeof boffMediaEventTeamMembers.$inferSelect;

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

export const boffMediaEventMedals = mysqlTable("boffmedia_event_medals", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }).notNull(),
  points: int("points").notNull().default(0),
  category: mysqlEnum("category", [
      "placement",
      "challenge",
      "participation"
  ]).notNull(),
  placement: int("placement"), // For placement medals (1 for gold, 2 for silver, etc.)
  maxProgress: int("max_progress").notNull().default(1),
  order: int("order").notNull().default(0),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type EventMedal = typeof boffMediaEventMedals.$inferSelect;

export const boffMediaEventChallenges = mysqlTable("boffmedia_event_challenges", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  medalId: int("medal_id").references(() => boffMediaEventMedals.id, { onDelete: "cascade", onUpdate: "cascade" }),
  maxProgress: int("max_progress").notNull().default(1),
  active: int("active").notNull().default(1),
});

export type EventChallenge = typeof boffMediaEventChallenges.$inferSelect;

export const boffMediaEventMedalProgress = mysqlTable("boffmedia_event_medal_progress", {
  userId: int("user_id").notNull(),
  medalId: int("medal_id").notNull(),
  currentProgress: int("current_progress").notNull().default(0),
  earned: int("earned").notNull().default(0),
  earnedAt: datetime("earned_at"),
  lastUpdated: datetime("last_updated").notNull().default(sql`CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
      pk: primaryKey({ columns: [table.userId, table.medalId] }),
      medalIdIdx: index("medal_id_idx").on(table.medalId),
      userFk: foreignKey({
          columns: [table.userId],
          foreignColumns: [boffMediaUsers.id],
          name: "fk_user_id"
      }).onDelete("cascade").onUpdate("cascade"),
      medalFk: foreignKey({
          columns: [table.medalId],
          foreignColumns: [boffMediaEventMedals.id],
          name: "fk_medal_id"
      }).onDelete("cascade").onUpdate("cascade"),
  };
});

export type EventMedalProgress = typeof boffMediaEventMedalProgress.$inferSelect;

export const boffMediaAchievements = mysqlTable("boffmedia_achievements", {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }).notNull(),
    eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
    target: int("target").notNull().default(1),
    rarity: mysqlEnum("rarity", ["bronze", "silver", "gold", "platinum", "diamond"]).notNull(),
    points: int("points").notNull().default(0),   
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Achievement = typeof boffMediaAchievements.$inferSelect;

export const boffMediaAchievementProgress = mysqlTable("boffmedia_achievement_progress", {
    userId: int("user_id").notNull(),
    achievementId: int("achievement_id").notNull(),
    progress: int("progress").notNull().default(0),
    completed: int("completed").notNull().default(0),
    completedAt: datetime("completed_at"),
    lastUpdated: datetime("last_updated").notNull().default(sql`CURRENT_TIMESTAMP()`),
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

export type AchievementProgress = typeof boffMediaAchievementProgress.$inferSelect;