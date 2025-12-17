import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, foreignKey, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { rotomEvents } from "./SmartRotomEvents";
import { smartrotomUsers } from "./SmartRotom";

/**
 * Bug hunt event data
 * For competitions to find bugs/issues in the server or game
 */
export const bugHuntEventData = mysqlTable("rotom_bughunt_data", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull().unique(),
  targetSystem: varchar("target_system", { length: 100 }), // e.g., "SmartRotom", "Pokemon System", "Economy"
  difficultyLevel: mysqlEnum("difficulty_level", ["EASY", "MEDIUM", "HARD", "EXPERT"]),
  rewardPerBug: int("reward_per_bug").default(100),
  maxReports: int("max_reports"), // Limit reports per player
  allowDuplicates: int("allow_duplicates").default(0),
  guidelines: text("guidelines"), // Bug reporting guidelines
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`).onUpdateNow(),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "bughunt_data_event_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type BugHuntEventData = typeof bugHuntEventData.$inferSelect;
export type BugHuntEventDataInsert = typeof bugHuntEventData.$inferInsert;

/**
 * Bug reports submitted during hunt
 */
export const bugReports = mysqlTable("rotom_bug_reports", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  reporterUuid: char("reporter_uuid", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  reproductionSteps: text("reproduction_steps"),
  severity: mysqlEnum("severity", ["TRIVIAL", "MINOR", "MAJOR", "CRITICAL"]).default("MINOR"),
  category: varchar("category", { length: 50 }), // e.g., "UI", "Gameplay", "Performance"
  status: mysqlEnum("status", [
    "PENDING_REVIEW",
    "VERIFIED",
    "DUPLICATE",
    "INVALID",
    "FIXED",
    "WONT_FIX"
  ]).default("PENDING_REVIEW"),
  verifiedBy: char("verified_by", { length: 36 }),
  screenshots: text("screenshots"), // JSON array of screenshot URLs
  reward: int("reward").default(0),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP()`),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "bug_report_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  reporterFk: foreignKey({
    columns: [table.reporterUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "bug_report_reporter_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  verifierFk: foreignKey({
    columns: [table.verifiedBy],
    foreignColumns: [smartrotomUsers.uuid],
    name: "bug_report_verifier_fk"
  }).onDelete("set null").onUpdate("cascade")
}));

export type BugReport = typeof bugReports.$inferSelect;
export type BugReportInsert = typeof bugReports.$inferInsert;

/**
 * Bug report comments/discussion
 */
export const bugReportComments = mysqlTable("rotom_bug_report_comments", {
  id: int("id").primaryKey().autoincrement(),
  reportId: int("report_id").notNull(),
  commenterUuid: char("commenter_uuid", { length: 36 }).notNull(),
  comment: text("comment").notNull(),
  isStaffComment: int("is_staff_comment").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  reportFk: foreignKey({
    columns: [table.reportId],
    foreignColumns: [bugReports.id],
    name: "bug_comment_report_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  commenterFk: foreignKey({
    columns: [table.commenterUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "bug_comment_commenter_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type BugReportComment = typeof bugReportComments.$inferSelect;
export type BugReportCommentInsert = typeof bugReportComments.$inferInsert;
