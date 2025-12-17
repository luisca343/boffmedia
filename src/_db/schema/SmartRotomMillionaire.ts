import { sql } from "drizzle-orm";
import { char, timestamp, int, mysqlTable, varchar, text, decimal, boolean, mysqlEnum, foreignKey } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";

export const millionaireSessions = mysqlTable("rotom_millionaire_sessions", {
  id: int("id").primaryKey().autoincrement(),
  sessionCode: varchar("session_code", { length: 8 }).notNull().unique(),
  conductorUuid: char("conductor_uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
  status: mysqlEnum("status", ["WAITING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).default("WAITING"),
  currentQuestion: int("current_question").default(0),
  lifelinesRemaining: text("lifelines_remaining").default('{"50:50":true,"phone":true,"audience":true}'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  conductorFk: foreignKey({
    columns: [table.conductorUuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "mill_session_conductor_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type MillionaireSession = typeof millionaireSessions.$inferSelect;

export const millionairePlayers = mysqlTable("rotom_millionaire_players", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  uuid: char("uuid", { length: 36 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  connectionStatus: mysqlEnum("connection_status", ["CONNECTED", "DISCONNECTED"]).default("CONNECTED"),
  lastHeartbeat: timestamp("last_heartbeat").default(sql`CURRENT_TIMESTAMP()`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  sessionFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [millionaireSessions.id],
    name: "mill_player_session_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  userFk: foreignKey({
    columns: [table.uuid],
    foreignColumns: [smartrotomUsers.uuid],
    name: "mill_player_user_fk"
  }).onDelete("cascade").onUpdate("cascade")
}));

export type MillionairePlayer = typeof millionairePlayers.$inferSelect;

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

export const millionaireGameStates = mysqlTable("rotom_millionaire_game_states", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  questionNumber: int("question_number").notNull(),
  questionId: int("question_id").notNull(),
  playerAnswer: int("player_answer"),
  isCorrect: boolean("is_correct"),
  lifelineUsed: varchar("lifeline_used", { length: 20 }),
  stateSnapshot: text("state_snapshot").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  sessionFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [millionaireSessions.id],
    name: "mill_state_session_fk"
  }).onDelete("cascade").onUpdate("cascade"),
  questionFk: foreignKey({
    columns: [table.questionId],
    foreignColumns: [millionaireQuestions.id],
    name: "mill_state_question_fk"
  })
}));

export type MillionaireGameState = typeof millionaireGameStates.$inferSelect;

export const millionaireAnswers = mysqlTable("rotom_millionaire_answers", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("session_id").notNull(),
  questionId: int("question_id").notNull(),
  playerUuid: char("player_uuid", { length: 36 }).notNull(),
  answerIndex: int("answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP()`),
}, (table) => ({
  sessionFk: foreignKey({
    columns: [table.sessionId],
    foreignColumns: [millionaireSessions.id],
    name: "mill_answer_session_fk"
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
