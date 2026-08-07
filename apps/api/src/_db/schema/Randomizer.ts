import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import {
  boffMediaTournaments,
  boffMediaTournamentParticipants,
} from './BoffMediaTournaments';
import { boffMediaUsers } from './BoffMedia';
import { packs } from './Packs';

/** Status of a randomizer event: draft | locked | running | finished */
export type RandomizerEventStatus = 'draft' | 'locked' | 'running' | 'finished';

/** Status of a participant assignment: pending | claimed | patched | verified */
export type RandomizerAssignmentStatus =
  | 'pending'
  | 'claimed'
  | 'patched'
  | 'verified';

/** Audit action for randomizer events and assignments */
export type RandomizerAuditAction =
  | 'ROM_RECEIVED'
  | 'PATCHED'
  | 'LOG_SEALED'
  | 'UNSEALED'
  | 'SEED_GENERATED'
  | 'CLAIMED'
  | 'VERIFY_FAILED';

export const randomizerEvents = mysqlTable(
  'randomizer_events',
  {
    id: int('id').primaryKey().autoincrement(),
    tournamentId: int('tournament_id').notNull(),
    gamePlatform: varchar('game_platform', { length: 8 }).notNull(), // "gba" | "nds"
    gameTitle: varchar('game_title', { length: 64 }).notNull(), // FVX game identifier
    settingsBlobSha512: char('settings_blob_sha512', { length: 128 }).notNull(), // .rnqs settings snapshot
    fvxJarSha512: char('fvx_jar_sha512', { length: 128 }).notNull(), // pinned jar patches
    cleanRomSha512: char('clean_rom_sha512', { length: 128 }).notNull(), // No-Intro clean-dump hash
    romHint: varchar('rom_hint', { length: 255 }), // human hint (e.g. "Pokémon FireRed (Spain)")
    packId: varchar('pack_id', { length: 32 }), // nullable FK to packs
    status: varchar('status', { length: 16 }).notNull().default('draft'), // draft | locked | running | finished
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    tournamentFk: foreignKey({
      name: 're_tournament_fk',
      columns: [table.tournamentId],
      foreignColumns: [boffMediaTournaments.id],
    }).onDelete('cascade'),
    packFk: foreignKey({
      name: 're_pack_fk',
      columns: [table.packId],
      foreignColumns: [packs.id],
    }).onDelete('set null'),
    tournamentIdx: index('re_tournament_idx').on(table.tournamentId),
    packIdx: index('re_pack_idx').on(table.packId),
  }),
);

export type RandomizerEvent = typeof randomizerEvents.$inferSelect;
export type NewRandomizerEvent = typeof randomizerEvents.$inferInsert;

export const randomizerAssignments = mysqlTable(
  'randomizer_assignments',
  {
    id: int('id').primaryKey().autoincrement(),
    eventId: int('event_id').notNull(),
    participantId: int('participant_id').notNull(),
    mcUuid: char('mc_uuid', { length: 36 }), // bound at first authenticated claim; nullable until claim
    seed: bigint('seed', { mode: 'number' }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'), // pending | claimed | patched | verified
    outputSha512: char('output_sha512', { length: 128 }), // sha512 of randomized output ROM
    logBlobSha512: char('log_blob_sha512', { length: 128 }), // sealed spoiler log blob ref
    claimedAt: timestamp('claimed_at'),
    patchedAt: timestamp('patched_at'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    eventFk: foreignKey({
      name: 'rass_event_fk',
      columns: [table.eventId],
      foreignColumns: [randomizerEvents.id],
    }).onDelete('cascade'),
    participantFk: foreignKey({
      name: 'rass_participant_fk',
      columns: [table.participantId],
      foreignColumns: [boffMediaTournamentParticipants.id],
    }).onDelete('cascade'),
    eventParticipantUnique: uniqueIndex('rass_event_participant_unique').on(
      table.eventId,
      table.participantId,
    ),
    eventIdx: index('rass_event_idx').on(table.eventId),
    mcUuidIdx: index('rass_mc_uuid_idx').on(table.mcUuid),
  }),
);

export type RandomizerAssignment = typeof randomizerAssignments.$inferSelect;
export type NewRandomizerAssignment = typeof randomizerAssignments.$inferInsert;

export const randomizerAudit = mysqlTable(
  'randomizer_audit',
  {
    id: int('id').primaryKey().autoincrement(),
    eventId: int('event_id'),
    assignmentId: int('assignment_id'),
    action: varchar('action', { length: 32 }).notNull(), // ROM_RECEIVED, PATCHED, LOG_SEALED, etc.
    actor: varchar('actor', { length: 64 }), // admin id / mc_uuid / 'system'
    meta: json('meta').$type<Record<string, unknown>>(), // additional context
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    eventFk: foreignKey({
      name: 'raud_event_fk',
      columns: [table.eventId],
      foreignColumns: [randomizerEvents.id],
    }).onDelete('set null'),
    assignmentFk: foreignKey({
      name: 'raud_assignment_fk',
      columns: [table.assignmentId],
      foreignColumns: [randomizerAssignments.id],
    }).onDelete('set null'),
    eventIdx: index('raud_event_idx').on(table.eventId),
  }),
);

export type RandomizerAuditRow = typeof randomizerAudit.$inferSelect;

export const randomizerPresets = mysqlTable(
  'randomizer_presets',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    gameScope: varchar('game_scope', { length: 32 }), // which game/gen the preset targets; nullable = any
    settingsJson: json('settings_json')
      .$type<Record<string, unknown>>()
      .notNull(), // RandomizerSettings JSON document
    rnqsBlobSha512: char('rnqs_blob_sha512', { length: 128 }), // encoded .rnqs blob ref; nullable until first encode
    updatedBy: int('updated_by'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    updatedByFk: foreignKey({
      name: 'rp_updated_by_fk',
      columns: [table.updatedBy],
      foreignColumns: [boffMediaUsers.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type RandomizerPreset = typeof randomizerPresets.$inferSelect;
export type NewRandomizerPreset = typeof randomizerPresets.$inferInsert;
