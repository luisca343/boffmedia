import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/** Product and surface dimensions for the customer-facing changelog. */
export const CHANGELOG_PRODUCT = {
  BOFFMEDIA: 'boffmedia',
  SMARTROTOM: 'smartrotom',
  ALL: 'all',
} as const;

export const CHANGELOG_PLATFORM = {
  ALL: 'all',
  WEB: 'web',
  DESKTOP: 'desktop',
} as const;

export const CHANGELOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
} as const;

export const CHANGELOG_TRANSLATION_STATUS = {
  DRAFT: 'draft',
  TRANSLATED: 'translated',
  REVIEWED: 'reviewed',
} as const;

export const CHANGELOG_LOCALE = {
  ES: 'es',
  EN: 'en',
} as const;

export type ChangelogProduct =
  (typeof CHANGELOG_PRODUCT)[keyof typeof CHANGELOG_PRODUCT];
export type ChangelogPlatform =
  (typeof CHANGELOG_PLATFORM)[keyof typeof CHANGELOG_PLATFORM];
export type ChangelogStatus =
  (typeof CHANGELOG_STATUS)[keyof typeof CHANGELOG_STATUS];
export type ChangelogTranslationStatus =
  (typeof CHANGELOG_TRANSLATION_STATUS)[keyof typeof CHANGELOG_TRANSLATION_STATUS];
export type ChangelogLocale =
  (typeof CHANGELOG_LOCALE)[keyof typeof CHANGELOG_LOCALE];

/**
 * Customer-facing product announcements. This is intentionally separate from
 * `desktop_releases` and `pack_versions.changelog`: those fields remain the
 * engineering/updater sources of truth for their existing workflows.
 */
export const boffMediaChangelogs = mysqlTable(
  'boffmedia_changelogs',
  {
    id: int('id').primaryKey().autoincrement(),
    product: mysqlEnum('product', [
      CHANGELOG_PRODUCT.BOFFMEDIA,
      CHANGELOG_PRODUCT.SMARTROTOM,
      CHANGELOG_PRODUCT.ALL,
    ]).notNull(),
    platform: mysqlEnum('platform', [
      CHANGELOG_PLATFORM.ALL,
      CHANGELOG_PLATFORM.WEB,
      CHANGELOG_PLATFORM.DESKTOP,
    ]).notNull(),
    version: varchar('version', { length: 32 }),
    status: mysqlEnum('status', [
      CHANGELOG_STATUS.DRAFT,
      CHANGELOG_STATUS.PUBLISHED,
      CHANGELOG_STATUS.UNPUBLISHED,
    ])
      .notNull()
      .default(CHANGELOG_STATUS.DRAFT),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    createdBy: int('created_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    updatedBy: int('updated_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => ({
    publishedIdx: index('boffmedia_changelog_published_idx').on(
      table.product,
      table.platform,
      table.status,
      table.publishedAt,
      table.id,
    ),
    statusIdx: index('boffmedia_changelog_status_idx').on(
      table.status,
      table.updatedAt,
    ),
  }),
);

/** Localized customer-facing content. Spanish is required for publication. */
export const boffMediaChangelogTranslations = mysqlTable(
  'boffmedia_changelog_translations',
  {
    id: int('id').primaryKey().autoincrement(),
    changelogId: int('changelog_id')
      .notNull()
      .references(() => boffMediaChangelogs.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    locale: mysqlEnum('locale', [
      CHANGELOG_LOCALE.ES,
      CHANGELOG_LOCALE.EN,
    ]).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary'),
    body: text('body').notNull(),
    ctaLabel: varchar('cta_label', { length: 255 }),
    status: mysqlEnum('status', [
      CHANGELOG_TRANSLATION_STATUS.DRAFT,
      CHANGELOG_TRANSLATION_STATUS.TRANSLATED,
      CHANGELOG_TRANSLATION_STATUS.REVIEWED,
    ])
      .notNull()
      .default(CHANGELOG_TRANSLATION_STATUS.DRAFT),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => ({
    changelogLocaleUq: uniqueIndex(
      'boffmedia_changelog_translation_locale_uq',
    ).on(table.changelogId, table.locale),
    statusIdx: index('boffmedia_changelog_translation_status_idx').on(
      table.changelogId,
      table.locale,
      table.status,
    ),
  }),
);

/**
 * Language-independent destinations. A row may target a concrete product and
 * surface or provide an `all` fallback for the resolver.
 */
export const boffMediaChangelogCtas = mysqlTable(
  'boffmedia_changelog_ctas',
  {
    id: int('id').primaryKey().autoincrement(),
    changelogId: int('changelog_id')
      .notNull()
      .references(() => boffMediaChangelogs.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    product: mysqlEnum('product', [
      CHANGELOG_PRODUCT.BOFFMEDIA,
      CHANGELOG_PRODUCT.SMARTROTOM,
      CHANGELOG_PRODUCT.ALL,
    ]).notNull(),
    platform: mysqlEnum('platform', [
      CHANGELOG_PLATFORM.ALL,
      CHANGELOG_PLATFORM.WEB,
      CHANGELOG_PLATFORM.DESKTOP,
    ]).notNull(),
    url: varchar('url', { length: 512 }).notNull(),
  },
  (table) => ({
    targetUq: uniqueIndex('boffmedia_changelog_cta_target_uq').on(
      table.changelogId,
      table.product,
      table.platform,
    ),
    changelogIdx: index('boffmedia_changelog_cta_changelog_idx').on(
      table.changelogId,
    ),
  }),
);

/** Per-account, per-product cursor. There is deliberately no global cursor. */
export const boffMediaUserChangelogState = mysqlTable(
  'boffmedia_user_changelog_state',
  {
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    product: mysqlEnum('product', [
      CHANGELOG_PRODUCT.BOFFMEDIA,
      CHANGELOG_PRODUCT.SMARTROTOM,
    ]).notNull(),
    lastSeenPublishedAt: timestamp('last_seen_published_at', {
      mode: 'date',
    }),
    lastSeenEntryId: int('last_seen_entry_id'),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => ({
    pk: primaryKey({
      name: 'boffmedia_user_changelog_state_pk',
      columns: [table.userId, table.product],
    }),
  }),
);

export type BoffMediaChangelog = typeof boffMediaChangelogs.$inferSelect;
export type NewBoffMediaChangelog = typeof boffMediaChangelogs.$inferInsert;
export type BoffMediaChangelogTranslation =
  typeof boffMediaChangelogTranslations.$inferSelect;
export type NewBoffMediaChangelogTranslation =
  typeof boffMediaChangelogTranslations.$inferInsert;
export type BoffMediaChangelogCta = typeof boffMediaChangelogCtas.$inferSelect;
export type NewBoffMediaChangelogCta =
  typeof boffMediaChangelogCtas.$inferInsert;
export type BoffMediaUserChangelogState =
  typeof boffMediaUserChangelogState.$inferSelect;
