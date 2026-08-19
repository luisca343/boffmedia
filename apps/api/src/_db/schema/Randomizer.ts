import {
  mysqlEnum,
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
  | 'CONFIG_CLOSED'
  | 'CONFIG_PUBLISHED'
  | 'CONFIG_REOPENED'
  | 'CONFIG_DELETED';

/**
 * Central library of admin-uploaded clean ROMs. A config pins the sha512 of one
 * of these at selection time (cleanRomSha512) and records provenance via rom_id.
 * The blob itself lives in the shared content-addressed pack blob store, keyed
 * by this sha512, and is never referenced by any pack manifest — so a player can
 * never download it. Only the admin routes and the server-side randomize job touch it.
 */
// Lifecycle of a randomizer config. `draft` is editable; `open` mints
// assignments on claim; `closed` stops minting; `published` unseals the seed,
// settings and spoiler log on the public transparency surface.
export const RANDOMIZER_CONFIG_STATUSES = [
  'draft',
  'open',
  'closed',
  'published',
] as const;
export type RandomizerConfigStatus =
  (typeof RANDOMIZER_CONFIG_STATUSES)[number];

// A player's assignment: minted on claim, `patched` once the randomized ROM has
// been produced and downloaded, `verified` once its hash was checked at launch.
export const RANDOMIZER_ASSIGNMENT_STATUSES = [
  'claimed',
  'patched',
  'verified',
] as const;
export type RandomizerAssignmentStatus =
  (typeof RANDOMIZER_ASSIGNMENT_STATUSES)[number];

export const randomizerRoms = mysqlTable(
  'randomizer_roms',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 128 }).notNull(), // human label, e.g. "Pokémon FireRed (USA)"
    gamePlatform: varchar('game_platform', { length: 8 }).notNull(), // "gba" | "nds"
    sha512: char('sha512', { length: 128 }).notNull(), // content address in the blob store
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    sha512Unique: uniqueIndex('rr_sha512_uq').on(table.sha512),
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
    status: mysqlEnum('status', RANDOMIZER_CONFIG_STATUSES)
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
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
    // The entitlement key. Event membership — which is what earns an assignment
    // — is an account-level fact, so keying on a Minecraft UUID locked out every
    // player who never linked one, for a feature that is emulator-only.
    boffmediaUserId: int('boffmedia_user_id').notNull(),
    // Audit context only, and null for an account with no Minecraft linked.
    mcUuid: char('mc_uuid', { length: 36 }),
    seed: bigint('seed', { mode: 'number' }).notNull(),
    status: mysqlEnum('status', RANDOMIZER_ASSIGNMENT_STATUSES)
      .notNull()
      .default('claimed'),
    outputSha512: char('output_sha512', { length: 128 }), // sha512 of randomized output ROM
    logBlobSha512: char('log_blob_sha512', { length: 128 }), // sealed spoiler log blob ref
    claimedAt: timestamp('claimed_at').defaultNow(),
    patchedAt: timestamp('patched_at'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
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
    }).onDelete('cascade'),
    configUserUnique: uniqueIndex('rass_config_user_uq').on(
      table.configId,
      table.boffmediaUserId,
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
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
