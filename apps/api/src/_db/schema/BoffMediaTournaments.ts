import {
  timestamp,
  int,
  mysqlTable,
  varchar,
  text,
  mysqlEnum,
  index,
  uniqueIndex,
  boolean,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';
import { boffMediaGames, boffMediaEvents } from './BoffMediaEvents';

export const TOURNAMENT_FORMAT = {
  SINGLE: 'single',
  DOUBLE: 'double',
  GROUPS: 'groups',
  ROUNDROBIN: 'roundrobin',
  SWISS: 'swiss',
  LEADERBOARD: 'leaderboard',
} as const;

export const COMPETITOR_KIND = {
  SOLO: 'solo',
  TEAM: 'team',
  ENTRY: 'entry',
} as const;

export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  REGISTRATION: 'registration',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TOURNAMENT_METRIC = {
  SCORE: 'score',
  TIME: 'time',
} as const;

export const TOURNAMENT_PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  ELIMINATED: 'eliminated',
  WITHDREW: 'withdrew',
  DISQUALIFIED: 'disqualified',
  /**
   * Registered but never entered: they missed check-in (and, on a
   * teamsheet-required tournament, never submitted a team) by the time the
   * field was resolved. Distinct from `withdrew`, which is the player's own
   * decision — an admin re-admits a `dropped` entrant before generate.
   * Appended last on purpose: MySQL stores ENUM by ordinal position.
   */
  DROPPED: 'dropped',
} as const;

export const MATCH_BRACKET = {
  WINNERS: 'winners',
  LOSERS: 'losers',
  GRAND: 'grand',
  GROUP: 'group',
  LEAGUE: 'league',
  SWISS: 'swiss',
  // Third-place playoff of a single-elim phase (fed by both semifinal losers).
  THIRD: 'third',
} as const;

export const MATCH_STATUS = {
  PENDING: 'pending',
  READY: 'ready',
  LIVE: 'live',
  COMPLETED: 'completed',
  BYE: 'bye',
} as const;

export const MATCH_SLOT = {
  TOP: 'top',
  BOT: 'bot',
} as const;

// Phases: a tournament is an ordered list of phases, each with its own format +
// config and an advancement rule deciding who moves to the next phase.
export const PHASE_FORMAT = {
  SINGLE: 'single',
  DOUBLE: 'double',
  ROUNDROBIN: 'roundrobin',
  SWISS: 'swiss',
  LEADERBOARD: 'leaderboard',
  // Group stage phase: entrants snake-seeded into round-robin groups; the
  // advancement rule takes the top N of each group, cross-seeded.
  GROUPS: 'groups',
} as const;

export const PHASE_STATUS = {
  PENDING: 'pending',
  LIVE: 'live',
  COMPLETED: 'completed',
} as const;

export const ADVANCE_TYPE = {
  ALL: 'all',
  TOP_N: 'top_n',
  RECORD: 'record',
  // Union: the top N by standings PLUS everyone at ≤ advance_max_losses losses.
  // Yields an asymmetric cut (VGC "top 8 + all X-2") — the bracket byes the
  // extra top seeds automatically.
  TOP_OR_RECORD: 'top_or_record',
} as const;

export const TIEBREAK_PROFILE = {
  POINTS: 'points',
  RESISTANCE: 'resistance',
} as const;

// Self-report proposal lifecycle: a participant proposes a result, the rival
// confirms (→ match settles, columns cleared) or disputes (→ admin resolves).
export const PROPOSAL_STATE = {
  PENDING: 'pending',
  DISPUTED: 'disputed',
} as const;

export const MATCH_MESSAGE_KIND = {
  SYS: 'sys',
  PLAYER: 'player',
  JUDGE: 'judge',
} as const;

// NOTE: FK constraints use explicit short names (foreignKey({ name })) because
// MySQL caps identifiers at 64 chars — drizzle's auto-generated
// `{table}_{col}_{reftable}_{refcol}_fk` names overflow with these table names.

export const boffMediaTournaments = mysqlTable(
  'boffmedia_tournaments',
  {
    id: int('id').primaryKey().autoincrement(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    gameId: int('game_id'),
    eventId: int('event_id'),
    format: mysqlEnum('format', [
      TOURNAMENT_FORMAT.SINGLE,
      TOURNAMENT_FORMAT.DOUBLE,
      TOURNAMENT_FORMAT.GROUPS,
      TOURNAMENT_FORMAT.ROUNDROBIN,
      TOURNAMENT_FORMAT.SWISS,
      TOURNAMENT_FORMAT.LEADERBOARD,
    ]).notNull(),
    competitorKind: mysqlEnum('competitor_kind', [
      COMPETITOR_KIND.SOLO,
      COMPETITOR_KIND.TEAM,
      COMPETITOR_KIND.ENTRY,
    ])
      .notNull()
      .default(COMPETITOR_KIND.SOLO),
    status: mysqlEnum('status', [
      TOURNAMENT_STATUS.DRAFT,
      TOURNAMENT_STATUS.REGISTRATION,
      TOURNAMENT_STATUS.LIVE,
      TOURNAMENT_STATUS.COMPLETED,
      TOURNAMENT_STATUS.CANCELLED,
    ])
      .notNull()
      .default(TOURNAMENT_STATUS.DRAFT),
    // Leaderboard-format ranking metric (null for bracket/league formats).
    metric: mysqlEnum('metric', [
      TOURNAMENT_METRIC.SCORE,
      TOURNAMENT_METRIC.TIME,
    ]),
    unit: varchar('unit', { length: 16 }),
    maxParticipants: int('max_participants'),
    registrationOpen: boolean('registration_open').notNull().default(false),
    // Games per match (BO1/BO3/BO5) — top_score/bot_score are games won.
    bestOf: int('best_of').notNull().default(1),
    // Minutes a player self-report waits for the rival before auto-verifying.
    // Null → the module default (DEFAULT_AUTO_VERIFY_MINUTES).
    autoVerifyMinutes: int('auto_verify_minutes'),
    // Groups format: number of groups + advancers per group.
    groupCount: int('group_count'),
    advanceCount: int('advance_count'),
    description: text('description'),
    rules: text('rules'),
    prizes: text('prizes'),
    // Manual check-in window: admin opens it; only checked-in entrants can be
    // kept at generate time (GenerateBracketDto.onlyCheckedIn).
    checkInOpen: boolean('check_in_open').notNull().default(false),
    /**
     * Entry requires a submitted teamsheet as well as check-in (VGC). Set by
     * the admin, NOT derived from the game: `boffmedia_games.title` is free
     * text and there is no regulation column to read.
     */
    teamsheetRequired: boolean('teamsheet_required').notNull().default(false),
    /**
     * When the field is resolved: everyone who has not entered by then is
     * dropped. Null → resolution happens on generate only.
     */
    entryDeadline: timestamp('entry_deadline'),
    /**
     * Set when the field was resolved. Despite the column name this is the
     * "field already resolved" marker, not a teamsheet lock: the sweeper reads
     * it so a second tick cannot re-drop an already-frozen field. Teamsheets
     * themselves stay editable until the tournament goes live — see
     * MatchReportService.setTeamsheet. Renaming it costs a migration for no
     * behaviour, so the meaning is recorded here instead.
     */
    teamsheetLockedAt: timestamp('teamsheet_locked_at'),
    banner: varchar('banner', { length: 255 }),
    icon: varchar('icon', { length: 255 }),
    hue: int('hue'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    // Set on completion. No hard FK: avoids a circular tournaments↔participants
    // constraint; the service only ever writes a valid participant id here.
    championParticipantId: int('champion_participant_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    gameIdx: index('t_game_idx').on(t.gameId),
    eventIdx: index('t_event_idx').on(t.eventId),
    statusIdx: index('t_status_idx').on(t.status),
    formatIdx: index('t_format_idx').on(t.format),
    gameFk: foreignKey({
      columns: [t.gameId],
      foreignColumns: [boffMediaGames.id],
      name: 't_game_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    eventFk: foreignKey({
      columns: [t.eventId],
      foreignColumns: [boffMediaEvents.id],
      name: 't_event_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type Tournament = typeof boffMediaTournaments.$inferSelect;

export const boffMediaTournamentGroups = mysqlTable(
  'boffmedia_tournament_groups',
  {
    id: int('id').primaryKey().autoincrement(),
    tournamentId: int('tournament_id').notNull(),
    // Set for phase-scoped groups (groups PHASE format); null on legacy
    // whole-tournament `groups` format groups.
    phaseId: int('phase_id'),
    name: varchar('name', { length: 64 }).notNull(),
    label: varchar('label', { length: 64 }),
    advanceCount: int('advance_count').notNull().default(2),
    order: int('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    tournamentIdx: index('tg_tournament_idx').on(t.tournamentId),
    phaseIdx: index('tg_phase_idx').on(t.phaseId),
    tournamentFk: foreignKey({
      columns: [t.tournamentId],
      foreignColumns: [boffMediaTournaments.id],
      name: 'tg_t_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type TournamentGroup = typeof boffMediaTournamentGroups.$inferSelect;

export const boffMediaTournamentParticipants = mysqlTable(
  'boffmedia_tournament_participants',
  {
    id: int('id').primaryKey().autoincrement(),
    tournamentId: int('tournament_id').notNull(),
    kind: mysqlEnum('kind', [
      COMPETITOR_KIND.SOLO,
      COMPETITOR_KIND.TEAM,
      COMPETITOR_KIND.ENTRY,
    ])
      .notNull()
      .default(COMPETITOR_KIND.SOLO),
    userId: int('user_id'),
    name: varchar('name', { length: 255 }).notNull(),
    tag: varchar('tag', { length: 16 }),
    avatar: varchar('avatar', { length: 255 }),
    seed: int('seed'),
    country: varchar('country', { length: 2 }),
    hue: int('hue'),
    groupId: int('group_id'),
    // Leaderboard-format entry fields.
    score: int('score'),
    meta: varchar('meta', { length: 255 }),
    verified: boolean('verified').notNull().default(false),
    // JSON array of up to 6 mons {slot,dex,name,item,ability,tera,moves[4]} —
    // shown to the current-round opponent on the match page (open teamsheet).
    teamsheet: text('teamsheet'),
    checkedInAt: timestamp('checked_in_at'),
    status: mysqlEnum('status', [
      TOURNAMENT_PARTICIPANT_STATUS.ACTIVE,
      TOURNAMENT_PARTICIPANT_STATUS.ELIMINATED,
      TOURNAMENT_PARTICIPANT_STATUS.WITHDREW,
      TOURNAMENT_PARTICIPANT_STATUS.DISQUALIFIED,
      TOURNAMENT_PARTICIPANT_STATUS.DROPPED,
    ])
      .notNull()
      .default(TOURNAMENT_PARTICIPANT_STATUS.ACTIVE),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    userIdx: index('tp_user_idx').on(t.userId),
    seedIdx: index('tp_seed_idx').on(t.tournamentId, t.seed),
    groupIdx: index('tp_group_idx').on(t.groupId),
    // One account may enter a tournament once. MySQL permits multiple NULL
    // user_ids, so admin-added no-account entrants are unaffected.
    userUnique: uniqueIndex('tp_user_uq').on(t.tournamentId, t.userId),
    tournamentFk: foreignKey({
      columns: [t.tournamentId],
      foreignColumns: [boffMediaTournaments.id],
      name: 'tp_t_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [boffMediaUsers.id],
      name: 'tp_user_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    groupFk: foreignKey({
      columns: [t.groupId],
      foreignColumns: [boffMediaTournamentGroups.id],
      name: 'tp_group_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type TournamentParticipant =
  typeof boffMediaTournamentParticipants.$inferSelect;

// Roster members of a team entrant (only for competitor_kind='team').
export const boffMediaTournamentRoster = mysqlTable(
  'boffmedia_tournament_roster',
  {
    id: int('id').primaryKey().autoincrement(),
    participantId: int('participant_id').notNull(),
    userId: int('user_id'),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 32 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    participantIdx: index('tr_participant_idx').on(t.participantId),
    participantFk: foreignKey({
      columns: [t.participantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tr_p_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [boffMediaUsers.id],
      name: 'tr_user_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type TournamentRosterMember =
  typeof boffMediaTournamentRoster.$inferSelect;

// An ordered phase of a tournament (e.g. "Día 1 — Suizo", "Top Cut"). Each has
// its own format/config; the advance_* columns describe who leaves this phase
// for the next one (all null on the final phase).
export const boffMediaTournamentPhases = mysqlTable(
  'boffmedia_tournament_phases',
  {
    id: int('id').primaryKey().autoincrement(),
    tournamentId: int('tournament_id').notNull(),
    phaseOrder: int('phase_order').notNull().default(1), // 1-based, contiguous
    name: varchar('name', { length: 128 }).notNull(),
    format: mysqlEnum('format', [
      PHASE_FORMAT.SINGLE,
      PHASE_FORMAT.DOUBLE,
      PHASE_FORMAT.ROUNDROBIN,
      PHASE_FORMAT.SWISS,
      PHASE_FORMAT.LEADERBOARD,
      PHASE_FORMAT.GROUPS, // appended last — in-place MySQL enum extension
    ]).notNull(),
    status: mysqlEnum('status', [
      PHASE_STATUS.PENDING,
      PHASE_STATUS.LIVE,
      PHASE_STATUS.COMPLETED,
    ])
      .notNull()
      .default(PHASE_STATUS.PENDING),
    bestOf: int('best_of'), // null → tournament.bestOf
    // Best-of override for the decisive match (single: winners final ·
    // double: grand final). Null → phase/tournament bestOf.
    finalsBestOf: int('finals_best_of'),
    rounds: int('rounds'), // swiss: fixed round count
    groupCount: int('group_count'), // groups: number of groups
    // single: also play a third-place match between the semifinal losers.
    thirdPlace: boolean('third_place').notNull().default(false),
    // Chain this phase's standings onto the previous phase's records (VGC Day 2).
    carryStandings: boolean('carry_standings').notNull().default(false),
    // Advancement rule OUT of this phase (null on the final phase).
    advanceType: mysqlEnum('advance_type', [
      ADVANCE_TYPE.ALL,
      ADVANCE_TYPE.TOP_N,
      ADVANCE_TYPE.RECORD,
      ADVANCE_TYPE.TOP_OR_RECORD, // appended last — in-place MySQL enum extension
    ]),
    advanceCount: int('advance_count'), // top_n: N · record: optional cap
    advanceMaxLosses: int('advance_max_losses'), // record: 2 → "X-2 or better"
    tiebreakProfile: mysqlEnum('tiebreak_profile', [
      TIEBREAK_PROFILE.POINTS,
      TIEBREAK_PROFILE.RESISTANCE,
    ])
      .notNull()
      .default(TIEBREAK_PROFILE.POINTS),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    // UNIQUE, not a plain index: advancement finds the next phase by
    // `phaseOrder + 1` and bracket generation by the minimum order, so two
    // phases sharing an order make "which phase is next" ambiguous.
    tournamentIdx: uniqueIndex('tph_tournament_order_uq').on(
      t.tournamentId,
      t.phaseOrder,
    ),
    tournamentFk: foreignKey({
      columns: [t.tournamentId],
      foreignColumns: [boffMediaTournaments.id],
      name: 'tph_t_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type TournamentPhase = typeof boffMediaTournamentPhases.$inferSelect;

// Who qualified into a phase, with their phase seed frozen at advancement time
// (a fact, not a recomputation). Phase 1 entrants = the active participants.
export const boffMediaTournamentPhaseEntrants = mysqlTable(
  'boffmedia_tournament_phase_entrants',
  {
    id: int('id').primaryKey().autoincrement(),
    phaseId: int('phase_id').notNull(),
    participantId: int('participant_id').notNull(),
    seed: int('seed').notNull(), // 1-based, from previous phase standings
    sourceRank: int('source_rank'), // rank they finished the previous phase at
    sourceRecord: varchar('source_record', { length: 16 }), // display: "7-2"
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex('tpe_phase_participant_uq').on(
      t.phaseId,
      t.participantId,
    ),
    // Seeds are 1..N within a phase and drive every pairing algorithm; a
    // duplicate silently produces a wrong bracket rather than an error.
    seedUnique: uniqueIndex('tpe_phase_seed_uq').on(t.phaseId, t.seed),
    phaseFk: foreignKey({
      columns: [t.phaseId],
      foreignColumns: [boffMediaTournamentPhases.id],
      name: 'tpe_ph_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    participantFk: foreignKey({
      columns: [t.participantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tpe_p_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type TournamentPhaseEntrant =
  typeof boffMediaTournamentPhaseEntrants.$inferSelect;

export const boffMediaTournamentMatches = mysqlTable(
  'boffmedia_tournament_matches',
  {
    id: int('id').primaryKey().autoincrement(),
    tournamentId: int('tournament_id').notNull(),
    phaseId: int('phase_id'),
    bracket: mysqlEnum('bracket', [
      MATCH_BRACKET.WINNERS,
      MATCH_BRACKET.LOSERS,
      MATCH_BRACKET.GRAND,
      MATCH_BRACKET.GROUP,
      MATCH_BRACKET.LEAGUE,
      MATCH_BRACKET.SWISS,
      MATCH_BRACKET.THIRD, // appended last — in-place MySQL enum extension
    ])
      .notNull()
      .default(MATCH_BRACKET.WINNERS),
    groupId: int('group_id'),
    roundNumber: int('round_number').notNull().default(1),
    position: int('position').notNull().default(0),
    topParticipantId: int('top_participant_id'),
    botParticipantId: int('bot_participant_id'),
    // Games won by each side (TnMatch g1/g2).
    topScore: int('top_score'),
    botScore: int('bot_score'),
    winnerParticipantId: int('winner_participant_id'),
    status: mysqlEnum('status', [
      MATCH_STATUS.PENDING,
      MATCH_STATUS.READY,
      MATCH_STATUS.LIVE,
      MATCH_STATUS.COMPLETED,
      MATCH_STATUS.BYE,
    ])
      .notNull()
      .default(MATCH_STATUS.PENDING),
    // Winner advances here (single/groups-knockout/double).
    nextMatchId: int('next_match_id'),
    nextMatchSlot: mysqlEnum('next_match_slot', [
      MATCH_SLOT.TOP,
      MATCH_SLOT.BOT,
    ]),
    // Loser drops here (double-elim).
    loserNextMatchId: int('loser_next_match_id'),
    loserNextMatchSlot: mysqlEnum('loser_next_match_slot', [
      MATCH_SLOT.TOP,
      MATCH_SLOT.BOT,
    ]),
    scheduledAt: timestamp('scheduled_at'),
    reportedAt: timestamp('reported_at'),
    // Player self-report proposal (cleared unconditionally when the match
    // settles). `proposed_games` is a per-game 'W'/'L' string normalized to the
    // TOP participant's perspective.
    proposedByParticipantId: int('proposed_by_participant_id'),
    proposedTopScore: int('proposed_top_score'),
    proposedBotScore: int('proposed_bot_score'),
    proposedGames: varchar('proposed_games', { length: 16 }),
    proposedAt: timestamp('proposed_at'),
    proposalExpiresAt: timestamp('proposal_expires_at'),
    proposalState: mysqlEnum('proposal_state', [
      PROPOSAL_STATE.PENDING,
      PROPOSAL_STATE.DISPUTED,
    ]),
    judgeRequestedAt: timestamp('judge_requested_at'),
    // Optimistic concurrency control: incremented on every settlement/amend.
    // Admin amends use this to ensure the match hasn't changed since they last
    // loaded it; a conflict (409) tells them to reload the match.
    version: int('version').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    phaseIdx: index('tm_phase_idx').on(t.phaseId),
    bracketIdx: index('tm_bracket_idx').on(
      t.tournamentId,
      t.bracket,
      t.roundNumber,
    ),
    groupIdx: index('tm_group_idx').on(t.groupId),
    nextIdx: index('tm_next_idx').on(t.nextMatchId),
    // The expired-proposal sweep filters exactly these two columns; without
    // this it scans every match of the tournament on each generate/advance.
    proposalIdx: index('tm_proposal_idx').on(t.tournamentId, t.proposalState),
    tournamentFk: foreignKey({
      columns: [t.tournamentId],
      foreignColumns: [boffMediaTournaments.id],
      name: 'tm_t_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    phaseFk: foreignKey({
      columns: [t.phaseId],
      foreignColumns: [boffMediaTournamentPhases.id],
      name: 'tm_phase_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    groupFk: foreignKey({
      columns: [t.groupId],
      foreignColumns: [boffMediaTournamentGroups.id],
      name: 'tm_group_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    topFk: foreignKey({
      columns: [t.topParticipantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tm_top_fk',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    botFk: foreignKey({
      columns: [t.botParticipantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tm_bot_fk',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    winnerFk: foreignKey({
      columns: [t.winnerParticipantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tm_win_fk',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    proposerFk: foreignKey({
      columns: [t.proposedByParticipantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
      name: 'tm_prop_fk',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    nextFk: foreignKey({
      columns: [t.nextMatchId],
      foreignColumns: [t.id],
      name: 'tm_next_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    loserNextFk: foreignKey({
      columns: [t.loserNextMatchId],
      foreignColumns: [t.id],
      name: 'tm_lnext_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type TournamentMatch = typeof boffMediaTournamentMatches.$inferSelect;

// Table chat of one match (players + judges + system lines). `author_name` is a
// display snapshot so rendering never needs a users join; kind 'sys' rows have
// no author. Visible only to the two match participants and admins.
export const boffMediaTournamentMatchMessages = mysqlTable(
  'boffmedia_tournament_match_messages',
  {
    id: int('id').primaryKey().autoincrement(),
    matchId: int('match_id').notNull(),
    authorUserId: int('author_user_id'),
    authorName: varchar('author_name', { length: 64 }),
    kind: mysqlEnum('kind', [
      MATCH_MESSAGE_KIND.SYS,
      MATCH_MESSAGE_KIND.PLAYER,
      MATCH_MESSAGE_KIND.JUDGE,
    ])
      .notNull()
      .default(MATCH_MESSAGE_KIND.PLAYER),
    body: varchar('body', { length: 1000 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    matchIdx: index('tmm_match_idx').on(t.matchId),
    matchFk: foreignKey({
      columns: [t.matchId],
      foreignColumns: [boffMediaTournamentMatches.id],
      name: 'tmm_m_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    authorFk: foreignKey({
      columns: [t.authorUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'tmm_u_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type TournamentMatchMessage =
  typeof boffMediaTournamentMatchMessages.$inferSelect;
