import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, foreignKey, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { rotomEvents } from "./SmartRotomEvents";
import { smartrotomUsers } from "./SmartRotom";

/**
 * Tournament event data
 * Supports various tournament formats: single elimination, double elimination, round robin, etc.
 */
export const tournamentEventData = mysqlTable("rotom_tournament_data", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull().unique(),
  tournamentFormat: mysqlEnum("tournament_format", [
    "SINGLE_ELIMINATION",
    "DOUBLE_ELIMINATION",
    "ROUND_ROBIN",
    "SWISS"
  ]).notNull(),
  battleFormat: varchar("battle_format", { length: 50 }), // e.g., "OU", "VGC", "Random Battle"
  currentRound: int("current_round").default(1),
  totalRounds: int("total_rounds"),
  bracketData: text("bracket_data"), // JSON with bracket structure
  rules: text("rules"), // JSON with tournament rules
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`).onUpdateNow(),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "tournament_data_event_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type TournamentEventData = typeof tournamentEventData.$inferSelect;
export type TournamentEventDataInsert = typeof tournamentEventData.$inferInsert;

/**
 * Individual tournament matches
 */
export const tournamentMatches = mysqlTable("rotom_tournament_matches", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  round: int("round").notNull(),
  matchNumber: int("match_number").notNull(),
  player1Uuid: char("player1_uuid", { length: 36 }),
  player2Uuid: char("player2_uuid", { length: 36 }),
  winnerUuid: char("winner_uuid", { length: 36 }),
  status: mysqlEnum("status", ["PENDING", "IN_PROGRESS", "COMPLETED", "FORFEIT"]).default("PENDING"),
  replayUrl: varchar("replay_url", { length: 500 }),
  matchData: text("match_data"), // JSON with match details
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "tournament_match_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  player1Fk: foreignKey({
    columns: [table.player1Uuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "tournament_match_player1_fk"
  }).onDelete("set null").onUpdate("cascade"),
  player2Fk: foreignKey({
    columns: [table.player2Uuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "tournament_match_player2_fk"
  }).onDelete("set null").onUpdate("cascade"),
  winnerFk: foreignKey({
    columns: [table.winnerUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "tournament_match_winner_fk"
  }).onDelete("set null").onUpdate("cascade")
}));

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type TournamentMatchInsert = typeof tournamentMatches.$inferInsert;
