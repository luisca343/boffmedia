import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, boolean, foreignKey } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";
import { rotomEvents } from "./SmartRotomEvents";

/**
 * Millionaire-specific event data
 * Links to the generic rotom_events table
 */
export const millionaireEventData = mysqlTable("rotom_millionaire_data", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull().unique(),
  currentQuestion: int("current_question").default(0),
  lifelinesRemaining: text("lifelines_remaining").default('{"50:50":true,"phone":true,"audience":true}'),
  prizePool: int("prize_pool").default(1000000),
  currentPrize: int("current_prize").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`).onUpdateNow(),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "millionaire_data_event_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type MillionaireEventData = typeof millionaireEventData.$inferSelect;
export type MillionaireEventDataInsert = typeof millionaireEventData.$inferInsert;

/**
 * Millionaire questions pool
 */
export const millionaireQuestions = mysqlTable("rotom_millionaire_questions", {
  id: int("id").primaryKey().autoincrement(),
  text: text("text").notNull(),
  answers: text("answers").notNull(),
  correctAnswer: int("correct_answer").notNull(),
  difficultyLevel: int("difficulty_level").notNull(),
  category: varchar("category", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
});

export type MillionaireQuestion = typeof millionaireQuestions.$inferSelect;
export type MillionaireQuestionInsert = typeof millionaireQuestions.$inferInsert;

/**
 * Millionaire answer tracking
 * Links answers to events
 */
export const millionaireAnswers = mysqlTable("rotom_millionaire_answers", {
  id: int("id").primaryKey().autoincrement(),
  eventId: int("event_id").notNull(),
  questionId: int("question_id").notNull(),
  playerUuid: char("player_uuid", { length: 36 }).notNull(),
  answerIndex: int("answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  eventFk: foreignKey({
    columns: [table.eventId],
    foreignColumns: [rotomEvents.id],
    name: "mill_answer_event_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  questionFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [millionaireQuestions.id],
    name: "mill_answer_question_fk"
  }),
  userFk: foreignKey({
    columns: [table.playerUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "mill_answer_user_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type MillionaireAnswer = typeof millionaireAnswers.$inferSelect;
export type MillionaireAnswerInsert = typeof millionaireAnswers.$inferInsert;

