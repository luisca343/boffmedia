import { datetime, int, longtext, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { uniqueIndex } from 'drizzle-orm/mysql-core';

// ─── Shared payload types ─────────────────────────────────────────────────────

/** EV (0–252) or SP (0–32 Champions) allocation per stat */
export interface StatSpread {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

/** One Pokémon slot parsed from a Champions or ladder paste, enriched with spread data */
export interface VgcMetaSlot {
  slotIndex: 0 | 1 | 2 | 3 | 4 | 5;
  speciesId: string;
  speciesName: string;
  nickname?: string;
  item?: string;
  ability?: string;
  moves: string[];
  nature?: string;
  /** SP (Champions) or EV (standard) spread parsed from the EVs: line */
  spread?: StatSpread;
}

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * One row per format + month + cutoff. Stores the full Smogon chaos JSON blob.
 * Files are ~6.5 MB uncompressed — longtext required.
 */
export const vgcSmogonSnapshots = mysqlTable(
  'vgc_smogon_snapshots',
  {
    id:       int('id').primaryKey().autoincrement(),
    formatId: varchar('format_id', { length: 64 }).notNull(),  // e.g. 'gen9vgc2026regi'
    month:    varchar('month',     { length: 7  }).notNull(),  // e.g. '2026-03'
    cutoff:   int('cutoff').notNull(),                         // 0 | 1500 | 1630 | 1760
    data:     longtext('data').notNull(),                      // serialized chaos JSON
    fetchedAt: datetime('fetched_at').notNull(),
  },
  (t) => ({
    formatMonthCutoffIdx: uniqueIndex('vgc_smogon_format_month_cutoff_idx').on(
      t.formatId,
      t.month,
      t.cutoff,
    ),
  }),
);

export type VgcSmogonSnapshot = typeof vgcSmogonSnapshots.$inferSelect;

/**
 * Parsed paste cache — one row per pokepast.es paste ID, immutable once fetched.
 * Defined before vgcPasteTeams so the FK reference resolves correctly.
 */
export const vgcPasteDetails = mysqlTable('vgc_paste_details', {
  pasteId:     varchar('paste_id',  { length: 32 }).primaryKey(),
  author:      varchar('author',    { length: 128 }),
  title:       varchar('title',     { length: 255 }),
  formatId:    varchar('format_id', { length: 64 }),
  parsedSlots: text('parsed_slots').notNull(),                 // JSON: VgcMetaSlot[]
  fetchedAt:   datetime('fetched_at').notNull(),
});

export type VgcPasteDetail = typeof vgcPasteDetails.$inferSelect;

/**
 * One row per team entry from the VGCPastes Google Sheet CSV.
 * pasteId is a nullable FK to vgcPasteDetails — populated in Phase 3 once the
 * paste has been fetched and parsed.
 */
export const vgcPasteTeams = mysqlTable('vgc_paste_teams', {
  id:           varchar('id',           { length: 16  }).primaryKey(),   // e.g. 'PC476'
  pasteId:      varchar('paste_id',     { length: 32  }).references(() => vgcPasteDetails.pasteId),
  pasteUrl:     varchar('paste_url',    { length: 255 }),
  playerName:   varchar('player_name',  { length: 128 }),
  tournament:   varchar('tournament',   { length: 255 }),
  dateShared:   varchar('date_shared',  { length: 16  }),               // 'DD Mon YYYY'
  rank:         varchar('rank',         { length: 64  }),
  regulationId: varchar('regulation_id',{ length: 64  }),
  species:      text('species').notNull(),                               // JSON: string[]
  fetchedAt:    datetime('fetched_at').notNull(),
});

export type VgcPasteTeam = typeof vgcPasteTeams.$inferSelect;

/** One row per scraped Limitless tournament */
export const vgcLimitlessTournaments = mysqlTable('vgc_limitless_tournaments', {
  id:          int('id').primaryKey().autoincrement(),
  limitlessId: varchar('limitless_id', { length: 64 }).notNull().unique(),
  name:        varchar('name',         { length: 255 }),
  date:        varchar('date',         { length: 32  }),
  format:      varchar('format',       { length: 64  }),
  playerCount: int('player_count'),
  fetchedAt:   datetime('fetched_at').notNull(),
});

export type VgcLimitlessTournament = typeof vgcLimitlessTournaments.$inferSelect;

/**
 * One row per player × tournament.
 * pasteText is the raw paste scraped from Limitless HTML — kept as source of truth
 * so parsedSlots can be regenerated if parse logic changes.
 */
export const vgcLimitlessTeams = mysqlTable('vgc_limitless_teams', {
  id:           int('id').primaryKey().autoincrement(),
  tournamentId: int('tournament_id').references(() => vgcLimitlessTournaments.id, { onDelete: 'cascade' }),
  playerSlug:   varchar('player_slug',  { length: 128 }).notNull(),
  playerName:   varchar('player_name',  { length: 128 }),
  record:       varchar('record',       { length: 16  }),               // e.g. '7-2-0'
  pasteText:    text('paste_text'),                                     // raw scraped paste
  parsedSlots:  text('parsed_slots'),                                   // JSON: VgcMetaSlot[]
  fetchedAt:    datetime('fetched_at').notNull(),
});

export type VgcLimitlessTeam = typeof vgcLimitlessTeams.$inferSelect;
