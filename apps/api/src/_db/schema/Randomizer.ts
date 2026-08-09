import { sql } from 'drizzle-orm';
import {
  bigint,
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
import { boffMediaUsers } from './BoffMedia';
import { boffMediaEvents } from './BoffMediaEvents';

/** Status of a randomizer config: draft | open | closed | published */
export type RandomizerConfigStatus = 'draft' | 'open' | 'closed' | 'published';

/** Status of an assignment: claimed | patched | verified */
export type RandomizerAssignmentStatus = 'claimed' | 'patched' | 'verified';

/** Audit action for randomizer configs and assignments */
export type RandomizerAuditAction =
  | 'ROM_RECEIVED'
  | 'ROM_GENERATED'
  | 'ROM_SERVED'
  | 'PATCHED'
  | 'LOG_SEALED'
  | 'VERIFY_PASSED'
  | 'VERIFY_FAILED'
  | 'CLAIMED'
  | 'SEED_MINTED'
  | 'CONFIG_OPENED'
  | 'CONFIG_CLOSED';

/**
 * Central library of admin-uploaded clean ROMs. A config pins the sha512 of one
 * of these at selection time (cleanRomSha512) and records provenance via rom_id.
 * The blob itself lives in the shared content-addressed pack blob store, keyed
 * by this sha512, and is never referenced by any pack manifest — so a player can
 * never download it. Only the admin routes and the server-side randomize job touch it.
 */
export const randomizerRoms = mysqlTable(
  'randomizer_roms',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 128 }).notNull(), // human label, e.g. "Pokémon FireRed (USA)"
    gamePlatform: varchar('game_platform', { length: 8 }).notNull(), // "gba" | "nds"
    sha512: char('sha512', { length: 128 }).notNull(), // content address in the blob store
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    sha512Unique: uniqueIndex('rr_sha512_unique').on(table.sha512),
    platformIdx: index('rr_platform_idx').on(table.gamePlatform),
  }),
);

export type RandomizerRom = typeof randomizerRoms.$inferSelect;
export type NewRandomizerRom = typeof randomizerRoms.$inferInsert;

export const randomizerConfigs = mysqlTable(
  'randomizer_configs',
  {
    id: int('id').primaryKey().autoincrement(),
    eventId: int('event_id').notNull().unique(),
    gamePlatform: varchar('game_platform', { length: 8 }).notNull(), // "gba" | "nds"
    gameTitle: varchar('game_title', { length: 64 }).notNull(), // FVX game identifier
    settingsBlobSha512: char('settings_blob_sha512', { length: 128 }).notNull(), // .rnqs settings snapshot
    fvxJarSha512: char('fvx_jar_sha512', { length: 128 }).notNull(), // pinned jar patches
    cleanRomSha512: char('clean_rom_sha512', { length: 128 }).notNull(), // No-Intro clean-dump hash (pinned execution value)
    romId: int('rom_id'), // provenance: library ROM this config's clean hash was pinned from; nullable for pre-library configs
    romHint: varchar('rom_hint', { length: 255 }), // human hint (e.g. "Pokémon FireRed (Spain)")
    status: varchar('status', { length: 16 }).notNull().default('draft'), // draft | open | closed | published
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    eventFk: foreignKey({
      name: 'rc_event_fk',
      columns: [table.eventId],
      foreignColumns: [boffMediaEvents.id],
    }).onDelete('cascade'),
    romFk: foreignKey({
      name: 'rc_rom_fk',
      columns: [table.romId],
      foreignColumns: [randomizerRoms.id],
    }).onDelete('restrict'),
    eventIdx: index('rc_event_idx').on(table.eventId),
    statusIdx: index('rc_status_idx').on(table.status),
    romIdx: index('rc_rom_idx').on(table.romId),
  }),
);

export type RandomizerConfig = typeof randomizerConfigs.$inferSelect;
export type NewRandomizerConfig = typeof randomizerConfigs.$inferInsert;

export const randomizerAssignments = mysqlTable(
  'randomizer_assignments',
  {
    id: int('id').primaryKey().autoincrement(),
    configId: int('config_id').notNull(),
    boffmediaUserId: int('boffmedia_user_id'),
    mcUuid: char('mc_uuid', { length: 36 }).notNull(), // minted at claim; immutable
    seed: bigint('seed', { mode: 'number' }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('claimed'), // claimed | patched | verified
    outputSha512: char('output_sha512', { length: 128 }), // sha512 of randomized output ROM
    logBlobSha512: char('log_blob_sha512', { length: 128 }), // sealed spoiler log blob ref
    claimedAt: timestamp('claimed_at').defaultNow(),
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
    configFk: foreignKey({
      name: 'rass_config_fk',
      columns: [table.configId],
      foreignColumns: [randomizerConfigs.id],
    }).onDelete('cascade'),
    userFk: foreignKey({
      name: 'rass_user_fk',
      columns: [table.boffmediaUserId],
      foreignColumns: [boffMediaUsers.id],
    }).onDelete('set null'),
    configMcUuidUnique: uniqueIndex('rass_config_mcuuid_unique').on(
      table.configId,
      table.mcUuid,
    ),
    configIdx: index('rass_config_idx').on(table.configId),
    mcUuidIdx: index('rass_mc_uuid_idx').on(table.mcUuid),
    userIdx: index('rass_user_idx').on(table.boffmediaUserId),
    statusIdx: index('rass_status_idx').on(table.status),
  }),
);

export type RandomizerAssignment = typeof randomizerAssignments.$inferSelect;
export type NewRandomizerAssignment = typeof randomizerAssignments.$inferInsert;

export const randomizerAudit = mysqlTable(
  'randomizer_audit',
  {
    id: int('id').primaryKey().autoincrement(),
    configId: int('config_id'),
    assignmentId: int('assignment_id'),
    action: varchar('action', { length: 32 }).notNull(), // ROM_RECEIVED, PATCHED, LOG_SEALED, VERIFY_PASSED, etc.
    actor: varchar('actor', { length: 64 }), // admin id / launcher:{mc_uuid} / 'system'
    meta: json('meta').$type<Record<string, unknown>>(), // additional context
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    configFk: foreignKey({
      name: 'raud_config_fk',
      columns: [table.configId],
      foreignColumns: [randomizerConfigs.id],
    }).onDelete('set null'),
    assignmentFk: foreignKey({
      name: 'raud_assignment_fk',
      columns: [table.assignmentId],
      foreignColumns: [randomizerAssignments.id],
    }).onDelete('set null'),
    configIdx: index('raud_config_idx').on(table.configId),
    assignmentIdx: index('raud_assignment_idx').on(table.assignmentId),
    actionIdx: index('raud_action_idx').on(table.action),
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
