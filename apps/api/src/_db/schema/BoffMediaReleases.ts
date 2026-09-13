import {
  char,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { jsonColumn } from './_json';
import { boffMediaUsers } from './BoffMedia';

export const RELEASE_SURFACES = ['web', 'api', 'desktop'] as const;
export type ReleaseSurface = (typeof RELEASE_SURFACES)[number];

export const RELEASE_STATUSES = ['draft', 'published', 'archived'] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

export const RELEASE_CREATION_SOURCES = [
  'fragments',
  'manual',
  'migration',
] as const;
export type ReleaseCreationSource = (typeof RELEASE_CREATION_SOURCES)[number];

export const RELEASE_CHANGELOG_MODES = ['entries', 'none'] as const;
export type ReleaseChangelogMode = (typeof RELEASE_CHANGELOG_MODES)[number];

export const RELEASE_ENTRY_TYPES = [
  'new',
  'improvement',
  'fix',
  'security',
  'deprecated',
  'removed',
] as const;
export type ReleaseEntryType = (typeof RELEASE_ENTRY_TYPES)[number];

export const RELEASE_FRAGMENT_STATES = [
  'claimed',
  'consumed',
  'released',
] as const;
export type ReleaseFragmentState = (typeof RELEASE_FRAGMENT_STATES)[number];

export const DEPLOYMENT_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const;
export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

export const DEPLOYMENT_STATUSES = ['verified', 'failed'] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const RELEASE_LOCALES = ['en', 'es'] as const;
export type ReleaseLocale = (typeof RELEASE_LOCALES)[number];

/** Product-level release metadata. Artifact identity lives in deployments. */
export const boffmediaReleases = mysqlTable(
  'boffmedia_releases',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Canonical SemVer, without a leading `v`. */
    version: varchar('version', { length: 64 }).notNull(),
    status: mysqlEnum('status', [...RELEASE_STATUSES])
      .notNull()
      .default('draft'),
    creationSource: mysqlEnum('creation_source', [...RELEASE_CREATION_SOURCES])
      .notNull()
      .default('fragments'),
    /** An explicit empty changelog is different from a missing fragment. */
    changelogMode: mysqlEnum('changelog_mode', [...RELEASE_CHANGELOG_MODES])
      .notNull()
      .default('entries'),
    /** A release can intentionally cover only a subset of product surfaces. */
    requiredSurfaces: jsonColumn('required_surfaces')
      .$type<ReleaseSurface[]>()
      .notNull(),
    /** Commit/version manifest identity used by CI to prevent stale artifacts. */
    sourceCommitSha: varchar('source_commit_sha', { length: 64 }),
    versionFileSha: char('version_file_sha', { length: 64 }),
    createdBy: int('created_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    approvedAt: timestamp('approved_at'),
    approvedBy: int('approved_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    publishedAt: timestamp('published_at'),
    /** Published history is retained; a rollback is represented explicitly. */
    withdrawnAt: timestamp('withdrawn_at'),
    withdrawnBy: int('withdrawn_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    withdrawalReason: text('withdrawal_reason'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    versionUq: uniqueIndex('boffmedia_releases_version_uq').on(table.version),
    statusPublishedIdx: index('boffmedia_releases_status_published_idx').on(
      table.status,
      table.publishedAt,
    ),
  }),
);

/** One visible item in a product release. */
export const boffmediaReleaseEntries = mysqlTable(
  'boffmedia_release_entries',
  {
    id: int('id').primaryKey().autoincrement(),
    releaseId: int('release_id')
      .notNull()
      .references(() => boffmediaReleases.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    type: mysqlEnum('type', [...RELEASE_ENTRY_TYPES]).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    releaseOrderIdx: index('boffmedia_release_entries_release_order_idx').on(
      table.releaseId,
      table.sortOrder,
    ),
  }),
);

/** Localized editorial content. English is the required fallback locale. */
export const boffmediaReleaseEntryTranslations = mysqlTable(
  'boffmedia_release_entry_translations',
  {
    id: int('id').primaryKey().autoincrement(),
    entryId: int('entry_id')
      .notNull()
      .references(() => boffmediaReleaseEntries.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    locale: mysqlEnum('locale', [...RELEASE_LOCALES]).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    entryLocaleUq: uniqueIndex(
      'boffmedia_release_entry_translations_entry_locale_uq',
    ).on(table.entryId, table.locale),
  }),
);

/** Registry that makes repository fragments single-use and auditable. */
export const boffmediaReleaseFragments = mysqlTable(
  'boffmedia_release_fragments',
  {
    id: int('id').primaryKey().autoincrement(),
    releaseId: int('release_id')
      .notNull()
      .references(() => boffmediaReleases.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
    fragmentId: varchar('fragment_id', { length: 128 }).notNull(),
    sourcePath: varchar('source_path', { length: 255 }).notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    sourceCommitSha: varchar('source_commit_sha', { length: 64 }).notNull(),
    state: mysqlEnum('state', [...RELEASE_FRAGMENT_STATES])
      .notNull()
      .default('claimed'),
    claimedAt: timestamp('claimed_at').notNull().defaultNow(),
    consumedAt: timestamp('consumed_at'),
    releasedAt: timestamp('released_at'),
  },
  (table) => ({
    fragmentIdUq: uniqueIndex('boffmedia_release_fragments_fragment_id_uq').on(
      table.fragmentId,
    ),
    releaseStateIdx: index('boffmedia_release_fragments_release_state_idx').on(
      table.releaseId,
      table.state,
    ),
  }),
);

/** One immutable verification attempt per deployment idempotency key. */
export const boffmediaDeployments = mysqlTable(
  'boffmedia_deployments',
  {
    id: int('id').primaryKey().autoincrement(),
    releaseId: int('release_id').references(() => boffmediaReleases.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    surface: mysqlEnum('surface', [...RELEASE_SURFACES]).notNull(),
    environment: mysqlEnum('environment', [
      ...DEPLOYMENT_ENVIRONMENTS,
    ]).notNull(),
    productVersion: varchar('product_version', { length: 64 }).notNull(),
    buildId: varchar('build_id', { length: 128 }).notNull(),
    gitSha: varchar('git_sha', { length: 64 }),
    versionFileSha: char('version_file_sha', { length: 64 }),
    status: mysqlEnum('status', [...DEPLOYMENT_STATUSES]).notNull(),
    healthCheckUrl: varchar('health_check_url', { length: 512 }),
    healthCheckedAt: timestamp('health_checked_at'),
    failureReason: text('failure_reason'),
    metadata: jsonColumn('metadata').$type<Record<string, unknown>>(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    recordedBy: varchar('recorded_by', { length: 128 }).notNull(),
    deployedAt: timestamp('deployed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    idempotencyUq: uniqueIndex('boffmedia_deployments_idempotency_uq').on(
      table.idempotencyKey,
    ),
    releaseSurfaceStatusIdx: index(
      'boffmedia_deployments_release_surface_status_idx',
    ).on(table.releaseId, table.surface, table.environment, table.status),
    versionSurfaceEnvironmentIdx: index(
      'boffmedia_deployments_version_surface_environment_idx',
    ).on(table.productVersion, table.surface, table.environment),
  }),
);

/** Authenticated users only; anonymous clients keep their seen state locally. */
export const boffmediaReleaseViews = mysqlTable(
  'boffmedia_release_views',
  {
    id: int('id').primaryKey().autoincrement(),
    releaseId: int('release_id')
      .notNull()
      .references(() => boffmediaReleases.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    seenAt: timestamp('seen_at').notNull().defaultNow(),
  },
  (table) => ({
    releaseUserUq: uniqueIndex('boffmedia_release_views_release_user_uq').on(
      table.releaseId,
      table.userId,
    ),
    userSeenIdx: index('boffmedia_release_views_user_seen_idx').on(
      table.userId,
      table.seenAt,
    ),
  }),
);

export type BoffMediaRelease = typeof boffmediaReleases.$inferSelect;
export type NewBoffMediaRelease = typeof boffmediaReleases.$inferInsert;
export type BoffMediaReleaseEntry = typeof boffmediaReleaseEntries.$inferSelect;
export type BoffMediaReleaseTranslation =
  typeof boffmediaReleaseEntryTranslations.$inferSelect;
export type BoffMediaReleaseFragment =
  typeof boffmediaReleaseFragments.$inferSelect;
export type BoffMediaDeployment = typeof boffmediaDeployments.$inferSelect;
