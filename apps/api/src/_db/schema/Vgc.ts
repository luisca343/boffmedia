import { datetime, double, foreignKey, index, int, mysqlTable, text, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';

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

/** One Pokemon slot parsed from a Champions or ladder paste, enriched with spread data */
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
  /** Tera type from Limitless API or Showdown paste Tera Type: line */
  tera?: string;
}

// ─── Tables ──────────────────────────────────────────────────────────────────

/** One row per format + month + cutoff — metadata only, data lives in vgcSmogonPokemon */
export const vgcSmogonSnapshots = mysqlTable(
  'vgc_smogon_snapshots',
  {
    id:           int('id').primaryKey().autoincrement(),
    formatId:     varchar('format_id',    { length: 64 }).notNull(),
    month:        varchar('month',        { length: 7  }).notNull(),
    cutoff:       int('cutoff').notNull(),
    pokemonCount: int('pokemon_count').notNull().default(0),
    fetchedAt:    datetime('fetched_at').notNull(),
  },
  (t) => [
    uniqueIndex('vgc_smogon_format_month_cutoff_idx').on(t.formatId, t.month, t.cutoff),
  ],
);

export type VgcSmogonSnapshot = typeof vgcSmogonSnapshots.$inferSelect;

/** One row per Pokémon per snapshot — normalized from Smogon stats.txt + moveset.txt */
export const vgcSmogonPokemon = mysqlTable(
  'vgc_smogon_pokemon',
  {
    id:           int('id').primaryKey().autoincrement(),
    formatId:     varchar('format_id',    { length: 64 }).notNull(),
    month:        varchar('month',        { length: 7  }).notNull(),
    cutoff:       int('cutoff').notNull(),
    speciesId:    varchar('species_id',   { length: 64 }).notNull(),
    speciesName:  varchar('species_name', { length: 64 }).notNull(),
    rank:         int('rank').notNull(),
    usagePercent: double('usage_percent').notNull(),
    rawCount:     int('raw_count').notNull(),
    topItem:      varchar('top_item',     { length: 64 }),
    topMove:      varchar('top_move',     { length: 64 }),
    topTeraType:  varchar('top_tera_type',{ length: 32 }),
    abilities:    text('abilities').notNull(),
    items:        text('items').notNull(),
    moves:        text('moves').notNull(),
    teraTypes:    text('tera_types').notNull(),
    teammates:    text('teammates').notNull(),
    spreads:      text('spreads').notNull(),
    fetchedAt:    datetime('fetched_at').notNull(),
  },
  (t) => [
    uniqueIndex('vgc_smogon_pokemon_idx').on(t.formatId, t.month, t.cutoff, t.speciesId),
  ],
);

export type VgcSmogonPokemonRow = typeof vgcSmogonPokemon.$inferSelect;

/**
 * Single source of truth for all Showdown-format pastes, regardless of origin.
 *
 * - Pastes from pokepast.es: pokepasteId is set; rawText + parsedSlots come from
 *   the pokepast.es JSON API.
 * - Pastes scraped inline from Limitless HTML: pokepasteId is null; rawText is
 *   extracted from the `const teamlist` JS variable on the teamlist page.
 * - If the same pokepast.es paste appears in both VGCPastes CSV and a Limitless
 *   tournament, a single vgcPastes row is shared — both FK references point to it.
 */
export const vgcPastes = mysqlTable('vgc_pastes', {
  id:          int('id').primaryKey().autoincrement(),
  pokepasteId: varchar('pokepaste_id', { length: 32 }).unique(),  // null if not from pokepast.es
  sourceKey:   varchar('source_key',   { length: 255 }).unique(), // stable dedup key for non-pokepaste sources (e.g. 'limitless:{id}:{slug}')
  rawText:     text('raw_text').notNull(),                         // source of truth for re-parsing
  parsedSlots: text('parsed_slots').notNull(),                     // JSON: VgcMetaSlot[]
  author:      varchar('author',    { length: 128 }),
  title:       varchar('title',     { length: 255 }),
  formatId:    varchar('format_id', { length: 64 }),
  fetchedAt:   datetime('fetched_at').notNull(),
});

export type VgcPaste = typeof vgcPastes.$inferSelect;

/**
 * One row per team entry from the VGCPastes Google Sheet CSV.
 *
 * species:       quick 6-species list from the CSV column — available in Phase 2
 *                without fetching any paste.
 * items:         parallel 6-item list extracted from the upper sprite-slot columns
 *                (col 7, 10, 13, 16, 19, 22) — free from Phase 2 without paste fetching.
 * pasteId:       populated in Phase 3 once the paste is stored in vgcPastes.
 * replicaStatus: '✔' = full replica; blank/other = unconfirmed. Used to gate Phase 3.
 * replicaCode:   in-game rental team code (e.g. '4RMQUHVYCY').
 * hasEvs:        whether the paste includes EV/SP spread data ('Yes'/'No' in sheet).
 */
export const vgcPasteTeams = mysqlTable(
  'vgc_paste_teams',
  {
    id:              varchar('id',              { length: 16  }).primaryKey(),  // e.g. 'PC476'
    pasteId:         int('paste_id').references(() => vgcPastes.id),            // null until Phase 3
    pasteUrl:        varchar('paste_url',       { length: 255 }),
    playerName:      varchar('player_name',     { length: 128 }),
    teamDescription: varchar('team_description',{ length: 512 }),
    tournament:      varchar('tournament',      { length: 255 }),
    dateShared:      varchar('date_shared',     { length: 16  }),               // 'DD Mon YYYY'
    rank:            varchar('rank',            { length: 64  }),
    regulationId:    varchar('regulation_id',   { length: 64  }),
    species:         text('species').notNull(),                                  // JSON: string[]
    items:           text('items').notNull().default('[]'),                      // JSON: string[]
    replicaStatus:   varchar('replica_status',  { length: 8   }),               // '✔' or blank
    replicaCode:     varchar('replica_code',    { length: 20  }),               // in-game team code
    hasEvs:          varchar('has_evs',         { length: 4   }),               // 'Yes' / 'No'
    sourceUrl:       varchar('source_url',      { length: 512 }),
    owner:           varchar('owner',           { length: 128 }),
    fetchedAt:       datetime('fetched_at').notNull(),
  },
  (t) => [
    index('vgc_paste_teams_regulation_idx').on(t.regulationId),
    index('vgc_paste_teams_regulation_paste_idx').on(t.regulationId, t.pasteId),
  ],
);

export type VgcPasteTeam = typeof vgcPasteTeams.$inferSelect;

/** One row per scraped Limitless tournament */
export const vgcLimitlessTournaments = mysqlTable(
  'vgc_limitless_tournaments',
  {
    id:           int('id').primaryKey().autoincrement(),
    limitlessId:  varchar('limitless_id',  { length: 64  }).notNull().unique(),
    name:         varchar('name',          { length: 255 }),
    date:         varchar('date',          { length: 32  }),
    format:       varchar('format',        { length: 64  }),
    playerCount:  int('player_count'),
    regulationId: varchar('regulation_id', { length: 64  }),
    status:       varchar('status',        { length: 16  }).notNull().default('pending'),
    progress:     int('progress').notNull().default(0),
    total:        int('total').notNull().default(0),
    errorMessage: text('error_message'),
    fetchedAt:    datetime('fetched_at').notNull(),
  },
  (t) => [
    index('vgc_limitless_tournaments_regulation_idx').on(t.regulationId),
    index('vgc_limitless_tournaments_regulation_status_idx').on(t.regulationId, t.status),
  ],
);

export type VgcLimitlessTournament = typeof vgcLimitlessTournaments.$inferSelect;

/**
 * One row per player x tournament.
 * pasteId: populated once the teamlist page is scraped and stored in vgcPastes.
 */
export const vgcLimitlessTeams = mysqlTable('vgc_limitless_teams', {
  id:           int('id').primaryKey().autoincrement(),
  tournamentId: int('tournament_id'),
  playerSlug:   varchar('player_slug', { length: 128 }).notNull(),
  playerName:   varchar('player_name', { length: 128 }),
  placing:      int('placing'),
  record:       varchar('record',      { length: 16  }),                // e.g. '7-2-0'
  pasteId:      int('paste_id').references(() => vgcPastes.id),         // null until paste scraped
  fetchedAt:    datetime('fetched_at').notNull(),
}, (t) => [
  index('vgc_limitless_teams_tournament_idx').on(t.tournamentId),
  index('vgc_limitless_teams_tournament_player_idx').on(t.tournamentId, t.playerSlug),
  index('vgc_limitless_teams_paste_idx').on(t.pasteId),
  foreignKey({
    name:           'vgc_lt_tournament_id_fk',
    columns:        [t.tournamentId],
    foreignColumns: [vgcLimitlessTournaments.id],
  }).onDelete('cascade'),
]);

export type VgcLimitlessTeam = typeof vgcLimitlessTeams.$inferSelect;

/**
 * Champions regulation definitions — persisted in DB so new regulations can be
 * added via the admin panel without a code deploy.
 *
 * formatId must correspond to a format registered in the Champions mod
 * (champions.mod.ts). The mod itself stays in code; only the data-sourcing
 * config (GID, name, etc.) lives here.
 */
export const vgcRegulations = mysqlTable(
  'vgc_regulations',
  {
    id:            varchar('id',             { length: 64  }).primaryKey(),  // e.g. 'vgc2026regma'
    formatId:      varchar('format_id',      { length: 128 }).notNull(),     // e.g. 'gen9championsvgc2026regma'
    name:          varchar('name',           { length: 255 }).notNull(),
    gameType:      varchar('game_type',      { length: 16  }).notNull().default('doubles'),
    vgcPastesGid:  varchar('vgcpastes_gid',  { length: 32  }),               // null = no VGCPastes sheet
    importStatus:  varchar('import_status',  { length: 16  }).notNull().default('idle'),
    importError:   text('import_error'),
    importTeamCount:   int('import_team_count').notNull().default(0),
    importFetchedCount:int('import_fetched_count').notNull().default(0),
    importStartedAt:   datetime('import_started_at'),
    importCompletedAt: datetime('import_completed_at'),
    active:        int('active').notNull().default(1),                        // 0 = soft-disabled
    createdAt:     datetime('created_at').notNull(),
  },
  (t) => [
    index('vgc_regulations_active_idx').on(t.active),
    index('vgc_regulations_format_idx').on(t.formatId),
  ],
);

export type VgcRegulation = typeof vgcRegulations.$inferSelect;
