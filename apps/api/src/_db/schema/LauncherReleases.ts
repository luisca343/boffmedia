import {
  boolean,
  char,
  index,
  int,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
  timestamp,
} from 'drizzle-orm/mysql-core';

// Boffmedia App auto-update — the artifacts Tauri v2's updater plugin downloads.
// One row per (version, target) pair: a single release ships several bundles
// (windows-x86_64, linux-x86_64, …) and the updater asks for exactly one of
// them, so the platform key has to be a column and not a JSON blob.
//
// The bytes themselves are NOT in the database. They live under
// LAUNCHER_RELEASE_DIR; this table is the index, mirroring how packs keeps
// override blobs on disk and their metadata in MySQL.

/** Tauri's platform key: `{os}-{arch}` — windows-x86_64, darwin-aarch64, … */
export type LauncherTarget = string;

export const launcherReleases = mysqlTable(
  'launcher_releases',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Semver, no leading `v`. Tauri compares this against its own version. */
    version: varchar('version', { length: 32 }).notNull(),
    target: varchar('target', { length: 32 }).$type<LauncherTarget>().notNull(),
    /** Minisign signature produced by `tauri signer` / the build's private key.
     *  The updater refuses any artifact whose signature does not verify, so a
     *  row without it is unpublishable, not merely incomplete. */
    signature: text('signature').notNull(),
    /** Release notes shown in the updater dialog. Markdown, user-facing. */
    notes: text('notes'),
    /** File name on disk AND the name Tauri sees. The extension is load-bearing:
     *  the updater picks its install strategy from it (.msi, .exe, .msi.zip,
     *  .nsis.zip, .AppImage.tar.gz, .app.tar.gz), so it is never normalised
     *  away. */
    artifactName: varchar('artifact_name', { length: 255 }).notNull(),
    /** Computed from the bytes as they land, never taken from the client. */
    artifactSha512: char('artifact_sha512', { length: 128 }).notNull(),
    sizeBytes: int('size_bytes', { unsigned: true }).notNull(),
    /** Draft until published: uploading the Windows bundle must not make the
     *  release live for machines whose own bundle is not up yet. */
    published: boolean('published').notNull().default(false),
    /** What the feed reports as `pub_date`. Set when published, not at upload. */
    publishedAt: timestamp('published_at'),
    /** boffmedia user id of the admin who uploaded it. No FK: the release must
     *  outlive the account, exactly like pack_audit. */
    uploadedBy: int('uploaded_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    // Re-uploading the same (version, target) replaces the row rather than
    // creating a second one — two rows would make "the latest" ambiguous and
    // the feed would flip between them.
    versionTargetIdx: uniqueIndex('launcher_releases_version_target_uq').on(
      table.version,
      table.target,
    ),
    // The feed's hot query: published rows for one target, newest first.
    targetPublishedIdx: index('launcher_releases_target_published_idx').on(
      table.target,
      table.published,
    ),
  }),
);

export type LauncherRelease = typeof launcherReleases.$inferSelect;
export type NewLauncherRelease = typeof launcherReleases.$inferInsert;
