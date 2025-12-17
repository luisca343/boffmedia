import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, foreignKey, decimal, mysqlEnum } from "drizzle-orm/mysql-core";
import { rotomEvents } from "./SmartRotomEvents";
import { smartrotomUsers } from "./SmartRotom";

/**
 * Building competition event data
 * For creative building contests in Minecraft
 */
export const buildingCompetitionData = mysqlTable("rotom_building_competition_data", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull().unique(),
  theme: varchar("theme", { length: 255 }).notNull(),
  buildTimeMinutes: int("build_time_minutes").default(60),
  votingPhase: mysqlEnum("voting_phase", ["NOT_STARTED", "ACTIVE", "COMPLETED"]).default("NOT_STARTED"),
  allowSpectatorVoting: int("allow_spectator_voting").default(1),
  judgingCriteria: text("judging_criteria"), // JSON: creativity, technique, theme adherence
  worldCoordinates: varchar("world_coordinates", { length: 100 }), // Build area coordinates
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`).onUpdateNow(),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "building_comp_data_event_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type BuildingCompetitionData = typeof buildingCompetitionData.$inferSelect;
export type BuildingCompetitionDataInsert = typeof buildingCompetitionData.$inferInsert;

/**
 * Individual build submissions
 */
export const buildSubmissions = mysqlTable("rotom_build_submissions", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  builderUuid: char("builder_uuid", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  coordinates: varchar("coordinates", { length: 100 }),
  screenshots: text("screenshots"), // JSON array of screenshot URLs
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "build_submission_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  builderFk: foreignKey({
    columns: [table.builderUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "build_submission_builder_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type BuildSubmission = typeof buildSubmissions.$inferSelect;
export type BuildSubmissionInsert = typeof buildSubmissions.$inferInsert;

/**
 * Votes for build submissions
 */
export const buildVotes = mysqlTable("rotom_build_votes", {
  id: int("id").primaryKey().autoincrement(),
  submissionId: int("submission_id").notNull(),
  voterUuid: char("voter_uuid", { length: 36 }).notNull(),
  creativityScore: decimal("creativity_score", { precision: 3, scale: 1 }), // 0.0 - 10.0
  techniqueScore: decimal("technique_score", { precision: 3, scale: 1 }),
  themeScore: decimal("theme_score", { precision: 3, scale: 1 }),
  totalScore: decimal("total_score", { precision: 4, scale: 1 }),
  comments: text("comments"),
  votedAt: timestamp("voted_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  submissionFk: foreignKey({
    columns: [table.submissionId],
    foreignColumns: [buildSubmissions.id],
    name: "build_vote_submission_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  voterFk: foreignKey({
    columns: [table.voterUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "build_vote_voter_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type BuildVote = typeof buildVotes.$inferSelect;
export type BuildVoteInsert = typeof buildVotes.$inferInsert;
