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
    deletedAt: datetime("deleted_at").default(null),
});

export type Game = typeof boffMediaGames.$inferSelect;

export const boffMediaEvents = mysqlTable("boffmedia_events", {
  id: int("id").primaryKey().autoincrement(),
  parentId: int("parent_id").references(() => boffMediaEvents.id, { onDelete: "cascade", onUpdate: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  gameId: int("game").references(() => boffMediaGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  description: text("description"),
  icon: varchar("icon", { length: 255 }).notNull(),
  banner: varchar("banner", { length: 255 }),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date"),
  status: mysqlEnum("status", [EVENT_STATUS.UPCOMING, EVENT_STATUS.ACTIVE, EVENT_STATUS.COMPLETED]).notNull().default(EVENT_STATUS.UPCOMING),
  visibility: mysqlEnum("visibility", [VISIBILITY_STATUS.PUBLIC, VISIBILITY_STATUS.PRIVATE]).notNull().default(VISIBILITY_STATUS.PRIVATE),
  type: mysqlEnum("type", ["event", "server"]).notNull(),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  deletedAt: datetime("deleted_at").default(null),
}, (table) => {
  return {
    gameIdx: index("game_idx").on(table.gameId),
  };
});

export type Event = typeof boffMediaEvents.$inferSelect;

export const boffMediaParticipants = mysqlTable("boffmedia_participants", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id"), // May be null for anonymous participants
  nickname: varchar("nickname", { length: 32 }),
  avatar: varchar("avatar", { length: 255 }),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    userIdx: index("p_user_idx").on(table.userId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [boffMediaUsers.id],
      name: "p_user_fk"
    }).onDelete("set null").onUpdate("cascade")
  };
});

export type Participant = typeof boffMediaParticipants.$inferSelect;

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
  deletedAt: datetime("deleted_at").default(null),
}, (table) => {
  return {
    eventIdx: index("et_event_idx").on(table.eventId),
  };
});

export type EventTeam = typeof boffMediaEventTeams.$inferSelect;

export const boffMediaEventTeamMembers = mysqlTable("boffmedia_event_team_members", {
  teamId: int("team_id").references(
    () => boffMediaEventTeams.id, 
    { onDelete: "cascade", onUpdate: "cascade" }
  ),
  participantId: int("participant_id").references(
    () => boffMediaParticipants.id, 
    { onDelete: "cascade", onUpdate: "cascade" }
  ),
  role: mysqlEnum("role", ["leader", "member"]).notNull().default("member"),
  joinedAt: datetime("joined_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
      pk: primaryKey({ columns: [table.teamId, table.participantId] }),
      roleIdx: index("etm_role_idx").on(table.teamId, table.role),
  };
});

export type EventTeamMember = typeof boffMediaEventTeamMembers.$inferSelect;


export const boffMediaEventParticipants = mysqlTable("boffmedia_event_participants", {
    id: int("id").primaryKey().autoincrement(),
    participantId: int("participant_id").notNull(),
    eventId: int("event_id").notNull(),
    status: mysqlEnum("status", [PARTICIPANT_STATUS.REGISTERED, PARTICIPANT_STATUS.CONFIRMED, PARTICIPANT_STATUS.DECLINED, PARTICIPANT_STATUS.REMOVED])
      .notNull().default(PARTICIPANT_STATUS.REGISTERED),
    comment: text("comment"),
    createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: datetime("updated_at")
        .notNull()
        .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
}, (table) => {
    return {
        eventIdx: index("ep_event_idx").on(table.eventId),
        participantIdx: index("ep_participant_idx").on(table.participantId),
        participantFk: foreignKey({
          columns: [table.participantId],
          foreignColumns: [boffMediaParticipants.id],
          name: "ep_participant_fk"
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
  deletedAt: datetime("deleted_at").default(null),
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
export const boffMediaParticipantProgress = mysqlTable("boffmedia_participant_progress", {
  participantId: int("participant_id").notNull(),
  achievementId: int("achievement_id").notNull(),
  currentProgress: int("current_progress").notNull().default(0),
  isCompleted: int("is_completed").notNull().default(0),
  completedAt: datetime("completed_at"),
  lastUpdated: datetime("last_updated").notNull().default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP()`),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.participantId, table.achievementId] }),
    achievementIdx: index("pp_achievement_idx").on(table.achievementId),
    participantFk: foreignKey({
      columns: [table.participantId],
      foreignColumns: [boffMediaParticipants.id],
      name: "pp_participant_fk"
    }).onDelete("cascade").onUpdate("cascade"),
    achievementFk: foreignKey({
      columns: [table.achievementId],
      foreignColumns: [boffMediaAchievements.id],
      name: "pp_achievement_fk"
    }).onDelete("cascade").onUpdate("cascade"),
    participantIdx: index("pp_participant_idx").on(table.participantId),
  };
});

export type ParticipantProgress = typeof boffMediaParticipantProgress.$inferSelect;



/**
 * Helper function to validate participant before awarding progress
 * @param participantId Participant ID to validate
 * @param achievementId Achievement ID 
 * @returns Boolean indicating if participant can receive progress for this achievement
 */
export async function validateParticipantCanReceiveAchievement(
  participantId: number, 
  achievementId: number, 
  db: any
): Promise<boolean> {
  // 1. Get the event ID for the achievement
  const achievement = await db.query.boffMediaAchievements.findFirst({
    where: (achievements, { eq, and, isNull }) => and(
      eq(achievements.id, achievementId),
      isNull(achievements.deletedAt) // Ensure achievement is not soft-deleted
    )
  });
  
  if (!achievement || !achievement.eventId) return false; // Achievement might be server-wide (no eventId) or deleted
  
  // Check if the event itself is soft-deleted
  const event = await db.query.boffMediaEvents.findFirst({
    where: (events, { eq, and, isNull }) => and(
        eq(events.id, achievement.eventId),
        isNull(events.deletedAt)
    )
  });
  if (!event) return false; // Event is soft-deleted

  // 2. Check if participant is registered for this event
  const eventParticipant = await db.query.boffMediaEventParticipants.findFirst({
    where: (p, { eq, and }) => and(
      eq(p.participantId, participantId),
      eq(p.eventId, achievement.eventId), // Use achievement.eventId safely now
      eq(p.status, PARTICIPANT_STATUS.CONFIRMED)
    )
  });
  
  return !!eventParticipant;
}