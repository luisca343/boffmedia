import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, mysqlEnum, foreignKey, uniqueIndex } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";

/**
 * Core event system for SmartRotom
 * Supports multiple event types: millionaire, tournament, building_competition, bug_hunt, etc.
 */
export const rotomEvents = mysqlTable("rotom_events", {
  id: int("id").primaryKey().autoincrement(),
  eventCode: varchar("event_code", { length: 8 }).notNull().unique(),
  eventType: mysqlEnum("event_type", [
    "MILLIONAIRE",
    "TOURNAMENT",
    "BUILDING_COMPETITION",
    "BUG_HUNT",
    "TRIVIA",
    "RACE",
    "SCAVENGER_HUNT"
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  conductorUuid: char("conductor_uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, { onDelete: "cascade", onUpdate: "cascade" }),
  status: mysqlEnum("status", [
    "WAITING",      // Event created, waiting to start
    "ACTIVE",       // Event is currently running
    "PAUSED",       // Event temporarily paused
    "COMPLETED",    // Event finished successfully
    "CANCELLED"     // Event cancelled/aborted
  ]).default("WAITING"),
  maxParticipants: int("max_participants"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`).onUpdateNow(),
}, (table) => ({
  conductorFk: foreignKey({
    columns: [table.conductorUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "event_conductor_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  eventCodeIdx: uniqueIndex("event_code_idx").on(table.eventCode)
}));

export type RotomEvent = typeof rotomEvents.$inferSelect;
export type RotomEventInsert = typeof rotomEvents.$inferInsert;

/**
 * Participants in an event
 * Generic table for all event types
 */
export const rotomEventParticipants = mysqlTable("rotom_event_participants", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  userUuid: char("user_uuid", { length: 36 }).notNull(),
  role: mysqlEnum("role", [
    "CONDUCTOR",    // Event organizer/host
    "PARTICIPANT",  // Regular participant
    "SPECTATOR",    // Watching only
    "JUDGE"         // For competitions requiring judges
  ]).default("PARTICIPANT"),
  connectionStatus: mysqlEnum("connection_status", ["CONNECTED", "DISCONNECTED"]).default("CONNECTED"),
  lastHeartbeat: timestamp("last_heartbeat").default(sql`CURRENT_TIMESTAMP()`),
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP()`),
  leftAt: timestamp("left_at"),
  metadata: text("metadata"), // JSON field for event-specific participant data
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "event_participant_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  userFk: foreignKey({
    columns: [table.userUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "event_participant_user_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  uniqueParticipant: uniqueIndex("unique_event_participant").on(table.eventId, table.userUuid)
}));

export type RotomEventParticipant = typeof rotomEventParticipants.$inferSelect;
export type RotomEventParticipantInsert = typeof rotomEventParticipants.$inferInsert;

/**
 * Event state snapshots
 * Tracks progression and state changes for any event
 */
export const rotomEventStates = mysqlTable("rotom_event_states", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  stateType: varchar("state_type", { length: 50 }).notNull(), // e.g., "QUESTION_ANSWERED", "ROUND_COMPLETED", "BUILD_SUBMITTED"
  stateData: text("state_data").notNull(), // JSON snapshot of the state
  actorUuid: char("actor_uuid", { length: 36 }), // Who triggered this state change
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "event_state_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  actorFk: foreignKey({
    columns: [table.actorUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "event_state_actor_fk"
  }).onDelete("set null").onUpdate("cascade")
}));

export type RotomEventState = typeof rotomEventStates.$inferSelect;
export type RotomEventStateInsert = typeof rotomEventStates.$inferInsert;

/**
 * Event rewards/prizes
 * Tracks rewards for event participants
 */
export const rotomEventRewards = mysqlTable("rotom_event_rewards", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  userUuid: char("user_uuid", { length: 36 }).notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // e.g., "COINS", "ITEMS", "ACHIEVEMENT"
  rewardData: text("reward_data").notNull(), // JSON with reward details
  claimed: int("claimed").default(0),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "event_reward_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  userFk: foreignKey({
    columns: [table.userUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "event_reward_user_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type RotomEventReward = typeof rotomEventRewards.$inferSelect;
export type RotomEventRewardInsert = typeof rotomEventRewards.$inferInsert;
