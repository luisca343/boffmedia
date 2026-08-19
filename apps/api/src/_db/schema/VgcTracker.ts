import {
  bigint,
  double,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { boffMediaUsers } from './BoffMedia';

// ─── JSON column payload types ───────────────────────────────────────────────

export interface PresetSlotData {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  speciesId: string;
  speciesName: string;
  nickname?: string;
  item?: string;
  ability?: string;
  moves: string[];
  nature?: string;
}

export interface MatchSlotData {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  speciesId: string | null;
  speciesName: string | null;
  role: 'lead' | 'back' | 'unknown';
}

export interface TeamSnapshotData {
  presetId?: string;
  slots: MatchSlotData[];
}

export interface MatchNoteData {
  id: string;
  text: string;
  createdAt: string;
  phase: 'live' | 'post';
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export const vgcTeamPresets = mysqlTable('tools_vgc_team_presets', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: int('user_id').references(() => boffMediaUsers.id, {
    onDelete: 'cascade',
  }),
  name: varchar('name', { length: 128 }).notNull(),
  regulationId: varchar('regulation_id', { length: 64 }).notNull(),
  exportString: text('export_string').notNull(),
  slots: text('slots').notNull(),
  currentVersion: int('current_version').notNull().default(1),
  versions: text('versions').notNull().default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type VgcTeamPreset = typeof vgcTeamPresets.$inferSelect;

export const vgcSessions = mysqlTable('tools_vgc_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: int('user_id').references(() => boffMediaUsers.id, {
    onDelete: 'cascade',
  }),
  label: varchar('label', { length: 128 }).notNull(),
  format: mysqlEnum('format', ['BO1', 'BO3']).notNull().default('BO1'),
  regulationId: varchar('regulation_id', { length: 64 }).notNull(),
  type: varchar('type', { length: 16 }).notNull().default('ladder'),
  activePresetId: varchar('active_preset_id', { length: 36 }),
  startElo: double('start_elo'),
  startedAt: timestamp('started_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  archivedAt: bigint('archived_at', { mode: 'number' }),
  tournamentName: varchar('tournament_name', { length: 255 }),
  limitlessTournamentId: int('limitless_tournament_id'),
  sessionNotes: text('session_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type VgcSession = typeof vgcSessions.$inferSelect;

export const vgcMatches = mysqlTable('tools_vgc_matches', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).references(
    () => vgcSessions.id,
    { onDelete: 'cascade' },
  ),
  userId: int('user_id').references(() => boffMediaUsers.id, {
    onDelete: 'cascade',
  }),
  format: mysqlEnum('format', ['BO1', 'BO3']).notNull().default('BO1'),
  myTeam: text('my_team').notNull(),
  opponentTeam: text('opponent_team').notNull(),
  opponentName: varchar('opponent_name', { length: 128 }),
  opponentArchetype: varchar('opponent_archetype', { length: 128 }),
  result: mysqlEnum('result', ['win', 'loss', 'draw']),
  outcomeTag: varchar('outcome_tag', { length: 32 }),
  turnCount: int('turn_count'),
  eloAfter: double('elo_after'),
  opponentElo: double('opponent_elo'),
  notes: text('notes').notNull().default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type VgcMatch = typeof vgcMatches.$inferSelect;

export const vgcSeries = mysqlTable('tools_vgc_series', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).references(
    () => vgcSessions.id,
    { onDelete: 'cascade' },
  ),
  userId: int('user_id').references(() => boffMediaUsers.id, {
    onDelete: 'cascade',
  }),
  // DELIBERATE exception to the timestamp convention (see _db/CONVENTIONS.md):
  // the VGC tracker is offline-first and syncs rows out of the client's IndexedDB,
  // so both stamps are the CLIENT's epoch millis — the value the offline copy was
  // created with, not the moment the server received it. Storing them as
  // `timestamp DEFAULT CURRENT_TIMESTAMP` would silently rewrite a series'
  // creation time to its upload time and break ordering against unsynced rows.
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  completedAt: bigint('completed_at', { mode: 'number' }),
  roundNumber: int('round_number'),
  opponentName: varchar('opponent_name', { length: 128 }),
  opponentArchetype: varchar('opponent_archetype', { length: 128 }),
  myTeam: text('my_team').notNull(),
  opponentTeam: text('opponent_team').notNull(),
  games: text('games').notNull().default('[]'),
  seriesResult: varchar('series_result', { length: 8 }),
  notes: text('notes').notNull().default('[]'),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type VgcSeries = typeof vgcSeries.$inferSelect;
