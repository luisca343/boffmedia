import { datetime, int, mysqlTable, varchar, text, primaryKey, mysqlEnum, index, foreignKey, boolean } from "drizzle-orm/mysql-core";
import { boffMediaUsers } from "./BoffMedia";
import { sql } from "drizzle-orm";

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;

export const VISIBILITY_STATUS = {
  PUBLIC: 'public',
  PRIVATE: 'private'
} as const;

export const PARTICIPANT_STATUS = {
  REGISTERED: 'registered',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  REMOVED: 'removed'
} as const;

export const boffMediaGames = mysqlTable("boffmedia_games", {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }).notNull(),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: datetime("updated_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
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
  status: mysqlEnum("status", [EVENT_STATUS.UPCOMING, EVENT_STATUS.ACTIVE, EVENT_STATUS.COMPLETED]).notNull().default(EVENT_STATUS.UPCOMING),
  visibility: mysqlEnum("visibility", [VISIBILITY_STATUS.PUBLIC, VISIBILITY_STATUS.PRIVATE]).notNull().default(VISIBILITY_STATUS.PRIVATE),
  type: mysqlEnum("type", ["event", "server"]).notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    gameIdx: index("game_idx").on(table.game),
  };
});

export type Event = typeof boffMediaEvents.$inferSelect;

// Teams table with role-based leadership
export const boffMediaEventTeams = mysqlTable("boffmedia_event_teams", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  tag: varchar("tag", { length: 10 }), // Short team tag/code
  icon: varchar("icon", { length: 255 }),
  totalScore: int("total_score").notNull().default(0),
  status: mysqlEnum("status", ["active", "disqualified", "withdrew"]).notNull().default("active"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    eventIdx: index("et_event_idx").on(table.eventId),
  };
});

export type EventTeam = typeof boffMediaEventTeams.$inferSelect;

// Team members with leadership role
export const boffMediaEventTeamMembers = mysqlTable("boffmedia_event_team_members", {
  teamId: int("team_id").references(
    () => boffMediaEventTeams.id, 
    { onDelete: "cascade", onUpdate: "cascade" }
  ),
  userId: int("user_id").references(
    () => boffMediaUsers.id, 
    { onDelete: "cascade", onUpdate: "cascade" }
  ),
  role: mysqlEnum("role", ["leader", "member"]).notNull().default("member"),
  joinedAt: datetime("joined_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
      pk: primaryKey({ columns: [table.teamId, table.userId] }),
      roleIdx: index("etm_role_idx").on(table.teamId, table.role),
  };
});

export type EventTeamMember = typeof boffMediaEventTeamMembers.$inferSelect;

export const boffMediaEventParticipants = mysqlTable("boffmedia_event_participants", {
    userId: int("user_id").notNull(),
    eventId: int("event_id"),
    status: mysqlEnum("status", [PARTICIPANT_STATUS.REGISTERED, PARTICIPANT_STATUS.CONFIRMED, PARTICIPANT_STATUS.DECLINED, PARTICIPANT_STATUS.REMOVED])
      .notNull().default(PARTICIPANT_STATUS.REGISTERED),
    comment: text("comment"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: datetime("updated_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.eventId] }),
        eventIdx: index("ep_event_idx").on(table.eventId),
        userFk: foreignKey({
          columns: [table.userId],
          foreignColumns: [boffMediaUsers.id],
          name: "ep_user_fk"
        }).onDelete("cascade").onUpdate("cascade"),
        eventFk: foreignKey({
          columns: [table.eventId],
          foreignColumns: [boffMediaEvents.id],
          name: "ep_event_fk"  
        }).onDelete("cascade").onUpdate("cascade")
    };
});

export type EventParticipant = typeof boffMediaEventParticipants.$inferSelect;

// Unified achievements table
export const boffMediaAchievements = mysqlTable("boffmedia_achievements", {
  id: int("id").primaryKey().autoincrement(),
  itemType: mysqlEnum("item_type", ["achievement", "medal"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }).notNull(),
  maxProgress: int("max_progress").notNull().default(1),
  points: int("points").notNull().default(0),
  eventId: int("event_id"),
  category: mysqlEnum("category", [
    "competition",   // For ranked/placement achievements (1st, 2nd, 3rd)
    "challenge",     // For specific tasks in events
    "participation", // For simply taking part in events
    "achievement"    // Exclusive for server-based long-term accomplishments
  ]).notNull(),
  rarity: mysqlEnum("rarity", ["bronze", "silver", "gold", "platinum", "diamond"]),
  hidden: boolean("hidden").notNull().default(false),
  order: int("order").notNull().default(0),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    eventIdx: index("a_event_idx").on(table.eventId),
    categoryIdx: index("a_category_idx").on(table.category),
    eventFk: foreignKey({
      columns: [table.eventId],
      foreignColumns: [boffMediaEvents.id],
      name: "a_event_fk"
    }).onDelete("cascade").onUpdate("cascade")
  };
});

export type Achievement = typeof boffMediaAchievements.$inferSelect;

// Unified user progress tracking
export const boffMediaUserProgress = mysqlTable("boffmedia_user_progress", {
  userId: int("user_id").notNull(),
  achievementId: int("achievement_id").notNull(),
  currentProgress: int("current_progress").notNull().default(0),
  isCompleted: int("is_completed").notNull().default(0),
  completedAt: datetime("completed_at"),
  lastUpdated: datetime("last_updated").notNull().default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.achievementId] }),
    achievementIdx: index("up_achievement_idx").on(table.achievementId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [boffMediaUsers.id],
      name: "up_user_fk"
    }).onDelete("cascade").onUpdate("cascade"),
    achievementFk: foreignKey({
      columns: [table.achievementId],
      foreignColumns: [boffMediaAchievements.id],
      name: "up_achievement_fk"
    }).onDelete("cascade").onUpdate("cascade"),
    userIdx: index("up_user_idx").on(table.userId),
  };
});

export type UserProgress = typeof boffMediaUserProgress.$inferSelect;


/**
 * Helper function to validate user participation before awarding progress
 * @param userId User ID to validate
 * @param achievementId Achievement ID 
 * @returns Boolean indicating if user can receive progress for this achievement
 */
export async function validateUserCanReceiveAchievement(userId: number, achievementId: number, db: any): Promise<boolean> {
  // 1. Get the event ID for the achievement
  const achievement = await db.query.boffMediaAchievements.findFirst({
    where: (achievements, { eq }) => eq(achievements.id, achievementId)
  });
  
  if (!achievement) return false;
  
  // 2. Check if user is a participant in this event
  const participant = await db.query.boffMediaEventParticipants.findFirst({
    where: (p, { eq, and }) => and(
      eq(p.userId, userId),
      eq(p.eventId, achievement.eventId)
    )
  });
  
  return !!participant;
}