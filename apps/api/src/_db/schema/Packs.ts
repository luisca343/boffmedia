import { sql } from 'drizzle-orm';
import {
  mysqlEnum,
  boolean,
  char,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

// The launcher's pack registry — HANDOFF §7. Identity is the BOFFMEDIA account:
// the right to a pack comes from an admin decision, a redeemed invite or
// membership of an event, none of which are Minecraft facts. `pack_acl` survives
// only as legacy pre-grants for UUIDs with no account behind them yet.

/** `public` · `password` · `allowlist` — mirrors PackAccess in @boffmedia/pack-schema. */
export const PACK_ACCESS_KINDS = ['public', 'password', 'allowlist'] as const;
export type PackAccessKind = (typeof PACK_ACCESS_KINDS)[number];

/** Mirrors MrpackDependencies' loader keys. Null = vanilla. */
export const PACK_LOADERS = [
  'forge',
  'neoforge',
  'fabric-loader',
  'quilt-loader',
] as const;
export type PackLoader = (typeof PACK_LOADERS)[number];

/** Which game a pack targets — mirrors GameType in @boffmedia/pack-schema.
 *  Immutable after creation (enforced in the service). The column used to be
 *  nullable with "NULL means minecraft" as a back-compat rule; on a clean
 *  database the default does that job honestly and every read gets a real value. */
export const GAME_TYPES = [
  'minecraft',
  'emulator',
  'zomboid',
  'stardew',
] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const packs = mysqlTable(
  'packs',
  {
    // App-generated rather than autoincrement: the id appears in manifests the
    // launcher caches on disk, and a sequential integer leaks how many packs exist.
    id: varchar('id', { length: 32 }).primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull().unique(),
    gameType: mysqlEnum('game_type', GAME_TYPES).notNull().default('minecraft'),
    name: varchar('name', { length: 128 }).notNull(),
    summary: varchar('summary', { length: 512 }),
    iconUrl: varchar('icon_url', { length: 512 }),
    description: text('description'),
    gallery: json('gallery').$type<unknown[]>(),
    // The Quick Play target when this pack is a "server pack". Null = a
    // client/singleplayer pack. Mirrors PackServer in @boffmedia/pack-schema:
    // `port` is optional (a bare host behind an SRV record declares none). Typed
    // loosely because the column can also hold a legacy/malformed `{}`.
    server: json('server').$type<{ host?: string; port?: number }>(),
    accessKind: mysqlEnum('access_kind', PACK_ACCESS_KINDS)
      .notNull()
      .default('allowlist'),
    // bcrypt, and only when accessKind = 'password'. §7.3 is explicit that this
    // gates composition and configs, never the mods themselves.
    passwordHash: varchar('password_hash', { length: 255 }),
    // The version launchers install. Null until something is published, which is
    // how "created but empty" stays distinguishable from "broken".
    latestVersionId: varchar('latest_version_id', { length: 32 }),
    archived: boolean('archived').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // No explicit slug index: the UNIQUE constraint above already creates one,
  // and a second would be paid for on every write for nothing.
);

export type Pack = typeof packs.$inferSelect;
export type NewPack = typeof packs.$inferInsert;

export const packVersions = mysqlTable(
  'pack_versions',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    packId: varchar('pack_id', { length: 32 }).notNull(),
    /** User-facing label: "1.4.2", "Season 3". Not semver, not ordered. */
    name: varchar('name', { length: 64 }).notNull(),
    // Nullable as of multi-game: only meaningful for `minecraft` packs (the
    // shared zod schema requires it iff the pack is minecraft). Non-MC versions
    // leave it, `loader`, and `loader_version` NULL.
    minecraft: varchar('minecraft', { length: 32 }),
    loader: mysqlEnum('loader', PACK_LOADERS),
    loaderVersion: varchar('loader_version', { length: 64 }),
    // The PackFile[] payload, validated against @boffmedia/pack-schema on write.
    // Stored whole rather than normalised: nothing queries an individual file,
    // and delta computation reads the entire list anyway.
    files: json('files').$type<unknown[]>().notNull(),
    // The BundledWorld[] payload, validated against @boffmedia/pack-schema on write.
    worlds: json('worlds').$type<unknown[]>(),
    // Per-game spec blocks — exactly one non-null per version, matching the
    // pack's gameType (validated by the shared zod schema on write; the DB does
    // not constrain their shape). Content schemas land per game cycle.
    emulator: json('emulator').$type<Record<string, unknown>>(),
    zomboid: json('zomboid').$type<Record<string, unknown>>(),
    stardew: json('stardew').$type<Record<string, unknown>>(),
    // The PackFile[] of first-install-only files (§initialFiles), validated
    // against @boffmedia/pack-schema on write.
    initialFiles: json('initial_files').$type<unknown[]>(),
    /** Draft versions are invisible to launchers — publishing is a deliberate act. */
    published: boolean('published').notNull().default(false),
    notes: text('notes'),
    // The Boffmedia admin who cut this version. Was char(36) — a Minecraft UUID
    // shape — and never written by anything, so every row said "nobody".
    createdBy: int('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    packFk: foreignKey({
      name: 'pack_versions_pack_fk',
      columns: [table.packId],
      foreignColumns: [packs.id],
    }).onDelete('cascade'),
    packIdx: index('pack_versions_pack_idx').on(table.packId),
  }),
);

export type PackVersion = typeof packVersions.$inferSelect;
export type NewPackVersion = typeof packVersions.$inferInsert;

/** Where a direct grant came from. Union semantics: losing one source leaves
 *  the others standing, which the old single-ACL-row model could not express. */
export const PACK_GRANT_SOURCES = ['admin', 'invite'] as const;
export type PackGrantSource = (typeof PACK_GRANT_SOURCES)[number];

/**
 * Per-ACCOUNT entitlement. Present row = access; revocation is a DELETE.
 *
 * Replaces `pack_acl` as the way grants are stored. The right to a pack derives
 * from Boffmedia-level facts (an admin decision, a redeemed invite, membership
 * of an event), so keying it on a Minecraft UUID forced every emulator flow to
 * round-trip through an identity it had no reason to need — and locked out any
 * account that never linked Minecraft.
 *
 * The primary key includes `source`: a player can hold an admin grant AND an
 * invite grant for the same pack, and revoking one must not revoke the other.
 */
export const packGrants = mysqlTable(
  'pack_grants',
  {
    packId: varchar('pack_id', { length: 32 }).notNull(),
    userId: int('user_id').notNull(),
    source: mysqlEnum('source', PACK_GRANT_SOURCES).notNull().default('admin'),
    /** The invite code this grant came from, when it came from one. */
    sourceRef: varchar('source_ref', { length: 32 }),
    /** Boffmedia user id of the admin who granted it; null for redemptions. */
    grantedBy: int('granted_by'),
    grantedAt: timestamp('granted_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.packId, table.userId, table.source] }),
    userIdx: index('pack_grants_user_idx').on(table.userId),
    packFk: foreignKey({
      name: 'pack_grants_pack_fk',
      columns: [table.packId],
      foreignColumns: [packs.id],
    }).onDelete('cascade'),
    userFk: foreignKey({
      name: 'pack_grants_user_fk',
      columns: [table.userId],
      foreignColumns: [boffMediaUsers.id],
    }).onDelete('cascade'),
  }),
);

export type PackGrant = typeof packGrants.$inferSelect;

/**
 * LEGACY pre-grants, kept only for Minecraft UUIDs with no matching account.
 * Rows joinable to an account were migrated into `pack_grants`; what is left is
 * a UUID an admin granted before that player ever registered, claimed when they
 * link that UUID. Drop the table once it is empty.
 */
export const packAcl = mysqlTable(
  'pack_acl',
  {
    packId: varchar('pack_id', { length: 32 }).notNull(),
    uuid: char('uuid', { length: 36 }).notNull(),
    grantedAt: timestamp('granted_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    /** Boffmedia user id of the admin who granted it, or null for invite redemptions. */
    grantedBy: int('granted_by'),
    /** The invite code this grant came from, when it came from one. */
    viaInvite: varchar('via_invite', { length: 32 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.packId, table.uuid] }),
    packFk: foreignKey({
      name: 'pack_acl_pack_fk',
      columns: [table.packId],
      foreignColumns: [packs.id],
    }).onDelete('cascade'),
    // No FK to rotom_users: a UUID can be granted access before that player has
    // ever touched SmartRotom, and an FK would make pre-granting impossible.
    uuidIdx: index('pack_acl_uuid_idx').on(table.uuid),
  }),
);

export type PackAcl = typeof packAcl.$inferSelect;

/** §7.2 — onboarding without knowing a UUID in advance. */
export const packInvites = mysqlTable(
  'pack_invites',
  {
    code: varchar('code', { length: 32 }).primaryKey(),
    packId: varchar('pack_id', { length: 32 }).notNull(),
    createdBy: int('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
    maxUses: int('max_uses').notNull().default(1),
    uses: int('uses').notNull().default(0),
    revoked: boolean('revoked').notNull().default(false),
  },
  (table) => ({
    packFk: foreignKey({
      name: 'pack_invites_pack_fk',
      columns: [table.packId],
      foreignColumns: [packs.id],
    }).onDelete('cascade'),
  }),
);

export type PackInvite = typeof packInvites.$inferSelect;

/** §7.2 asks for an audit log. Append-only; nothing updates a row here. */
export const packAudit = mysqlTable(
  'pack_audit',
  {
    id: int('id').primaryKey().autoincrement(),
    packId: varchar('pack_id', { length: 32 }),
    /** The Boffmedia account that performed the action, when known. No FK:
     *  like pack_id, the trail must survive the row it points at. */
    userId: int('user_id'),
    /** The Minecraft UUID the action concerns, when it concerns one. */
    uuid: char('uuid', { length: 36 }),
    action: varchar('action', { length: 32 }).notNull(),
    meta: json('meta').$type<Record<string, unknown>>(),
    at: timestamp('at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => ({
    packIdx: index('pack_audit_pack_idx').on(table.packId),
    userIdx: index('pack_audit_user_idx').on(table.userId),
    // No FK on pack_id: the audit trail must survive the pack being deleted,
    // which is exactly when it is most worth reading.
  }),
);

export type PackAudit = typeof packAudit.$inferSelect;
