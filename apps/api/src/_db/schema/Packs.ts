import { sql } from 'drizzle-orm';
import {
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

// The launcher's pack registry — HANDOFF §7. Identity is the Minecraft UUID
// throughout, proved via Mojang's `hasJoined` handshake (§7.2), which is why the
// ACL keys on `rotom_users.uuid` rather than on a Boffmedia account: a player
// who has never logged into the website still has to be grantable.

/** `public` · `password` · `allowlist` — mirrors PackAccess in @boffmedia/pack-schema. */
export type PackAccessKind = 'public' | 'password' | 'allowlist';

/** Mirrors MrpackDependencies' loader keys. Null = vanilla. */
export type PackLoader = 'forge' | 'neoforge' | 'fabric-loader' | 'quilt-loader';

export const packs = mysqlTable(
  'packs',
  {
    // App-generated rather than autoincrement: the id appears in manifests the
    // launcher caches on disk, and a sequential integer leaks how many packs exist.
    id: varchar('id', { length: 32 }).primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull().unique(),
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
    accessKind: varchar('access_kind', { length: 16 })
      .$type<PackAccessKind>()
      .notNull()
      .default('allowlist'),
    // bcrypt, and only when accessKind = 'password'. §7.3 is explicit that this
    // gates composition and configs, never the mods themselves.
    passwordHash: varchar('password_hash', { length: 255 }),
    // The version launchers install. Null until something is published, which is
    // how "created but empty" stays distinguishable from "broken".
    latestVersionId: varchar('latest_version_id', { length: 32 }),
    archived: boolean('archived').notNull().default(false),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`)
      .onUpdateNow(),
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
    minecraft: varchar('minecraft', { length: 32 }).notNull(),
    loader: varchar('loader', { length: 20 }).$type<PackLoader>(),
    loaderVersion: varchar('loader_version', { length: 64 }),
    // The PackFile[] payload, validated against @boffmedia/pack-schema on write.
    // Stored whole rather than normalised: nothing queries an individual file,
    // and delta computation reads the entire list anyway.
    files: json('files').$type<unknown[]>().notNull(),
    // The BundledWorld[] payload, validated against @boffmedia/pack-schema on write.
    worlds: json('worlds').$type<unknown[]>(),
    /** Draft versions are invisible to launchers — publishing is a deliberate act. */
    published: boolean('published').notNull().default(false),
    notes: text('notes'),
    createdBy: char('created_by', { length: 36 }),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
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

/** §7.2 — per-UUID entitlement. Present row = access; revocation is a DELETE. */
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

export type PackAclRow = typeof packAcl.$inferSelect;

/** §7.2 — onboarding without knowing a UUID in advance. */
export const packInvites = mysqlTable(
  'pack_invites',
  {
    code: varchar('code', { length: 32 }).primaryKey(),
    packId: varchar('pack_id', { length: 32 }).notNull(),
    createdBy: int('created_by'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
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
    // No FK on pack_id: the audit trail must survive the pack being deleted,
    // which is exactly when it is most worth reading.
  }),
);

export type PackAuditRow = typeof packAudit.$inferSelect;
