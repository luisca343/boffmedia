import {
  char,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';
import { rotomUsers } from './SmartRotom';

// ─────────────────────────────────────────────────────────────────────────────
// Post-moderation: content publishes instantly, users report it, admins work a
// queue. (Owner decision 2026-09-04 — not pre-moderation, not trusted-user
// gating.) The stored-XSS half of user-generated content is already closed by
// `common/html/sanitize-rich-text.ts`; what is left here is spam and abuse.
//
// The whole point of these three tables is that they are surface-agnostic. A
// report names a piece of content by `(content_type, content_id)` and nothing
// else, so the forum, Rooker and a profile bio share one queue, one dedupe rule
// and one audit vocabulary. Adding the next UGC surface is a registration in
// `api/boffmedia/moderation/content-registry.ts`, not a new table and not a new
// admin screen.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The surfaces the queue understands today. The runtime source of truth is the
 * registry — this const exists so the descriptors and the report DTO share one
 * spelling, and so a reader of the schema can see what `content_type` holds.
 *
 * Deliberately NOT a MySQL enum, which is the one place this file departs from
 * CONVENTIONS.md's "closed sets are enums" rule. An enum would make every new
 * UGC surface an ALTER TABLE, which is exactly the per-surface cost the design
 * exists to remove; the set is still closed, just closed in code — the registry
 * rejects an unknown `content_type` before it reaches a query.
 */
export const REPORTABLE_CONTENT = {
  FORUM_THREAD: 'forum_thread',
  FORUM_POST: 'forum_post',
  ROOKER_POST: 'rooker_post',
  USER_PROFILE: 'user_profile',
} as const;

export type ReportableContentType =
  (typeof REPORTABLE_CONTENT)[keyof typeof REPORTABLE_CONTENT];

/**
 * Why someone reported it. A genuinely closed set — it is a radio group in the
 * UI, and widening it changes what the reporter is asked — so this one IS an
 * enum. `other` is the escape hatch and is why `detail` exists.
 */
export const REPORT_REASON = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  HATE: 'hate',
  SEXUAL: 'sexual',
  ILLEGAL: 'illegal',
  OFF_TOPIC: 'off_topic',
  OTHER: 'other',
} as const;

export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];

export const REPORT_STATUS = {
  OPEN: 'open',
  ACTIONED: 'actioned',
  DISMISSED: 'dismissed',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

/**
 * One row per (content, reporter). The unique index is the dedupe rule: a
 * second report from the same person on the same item UPDATES their reason and
 * detail instead of inflating the count, so "how many times was this reported"
 * stays a count of *people* rather than a count of clicks. Without it, one
 * angry user could push anything to the top of the queue.
 *
 * `content_id` is a varchar because the PKs it points at are not one type:
 * `int` for the forum and Rooker, `char(36)` for a profile (the user uuid),
 * `varchar(36)` elsewhere. The registry owns the coercion back to the surface's
 * own type — see `parseId` on each descriptor.
 */
export const boffMediaContentReports = mysqlTable(
  'boffmedia_content_reports',
  {
    id: int('id').primaryKey().autoincrement(),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    contentId: varchar('content_id', { length: 64 }).notNull(),
    /** The website account that reported it. Reporting is a signed-in action. */
    reporterUserId: int('reporter_user_id').notNull(),
    reason: mysqlEnum('reason', [
      REPORT_REASON.SPAM,
      REPORT_REASON.HARASSMENT,
      REPORT_REASON.HATE,
      REPORT_REASON.SEXUAL,
      REPORT_REASON.ILLEGAL,
      REPORT_REASON.OFF_TOPIC,
      REPORT_REASON.OTHER,
    ]).notNull(),
    /** Optional free text from the reporter. */
    detail: varchar('detail', { length: 500 }),
    // The author, snapshotted at report time. Denormalised on purpose: "how
    // many reports has this author collected" is the question the queue is
    // built to answer, and resolving it live would mean one query per
    // registered surface per row. It also keeps the history readable after the
    // content itself is gone, which is when it matters most.
    //
    // Two columns rather than one because the product has two identity
    // systems and they do not always link: `boffmedia_users.id` for the
    // website, `rotom_users.uuid` for the in-game account. A Rooker post has
    // only the second.
    authorUserId: int('author_user_id'),
    authorUuid: char('author_uuid', { length: 36 }),
    status: mysqlEnum('status', [
      REPORT_STATUS.OPEN,
      REPORT_STATUS.ACTIONED,
      REPORT_STATUS.DISMISSED,
    ])
      .notNull()
      .default(REPORT_STATUS.OPEN),
    /** Admin-facing note recorded with the decision (the dismiss reason). */
    resolution: varchar('resolution', { length: 200 }),
    resolvedAt: timestamp('resolved_at'),
    resolvedByUserId: int('resolved_by_user_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    // Constraint names are prefixed `bcr_`: the full table name plus Drizzle's
    // generated suffix overflows MySQL's 64-character identifier limit, and an
    // over-long constraint is not created at all.
    reporterFk: foreignKey({
      columns: [t.reporterUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bcr_reporter_fk',
    }).onDelete('restrict'),
    authorFk: foreignKey({
      columns: [t.authorUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bcr_author_fk',
    }).onDelete('set null'),
    authorUuidFk: foreignKey({
      columns: [t.authorUuid],
      foreignColumns: [rotomUsers.uuid],
      name: 'bcr_author_uuid_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    resolverFk: foreignKey({
      columns: [t.resolvedByUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bcr_resolver_fk',
    }).onDelete('set null'),
    /** The dedupe rule, enforced by the database rather than by a read-then-write. */
    onePerReporterUq: uniqueIndex('bcr_content_reporter_uq').on(
      t.contentType,
      t.contentId,
      t.reporterUserId,
    ),
    /** The queue's own query: open reports grouped by content, worst first. */
    statusIdx: index('bcr_status_idx').on(t.status, t.createdAt),
    contentIdx: index('bcr_content_idx').on(t.contentType, t.contentId),
    authorIdx: index('bcr_author_idx').on(t.authorUserId),
    authorUuidIdx: index('bcr_author_uuid_idx').on(t.authorUuid),
  }),
);

export type ContentReport = typeof boffMediaContentReports.$inferSelect;
export type NewContentReport = typeof boffMediaContentReports.$inferInsert;

/**
 * The hide decision, one row per content item. Separate from the report because
 * many reports resolve to one decision, and because the decision has to be
 * readable by surfaces that know nothing about reports.
 *
 * Hiding NEVER deletes. `hidden_at` is a latch: setting it hides, clearing it
 * restores, and the row stays either way so `hidden_reason` and the audit trail
 * survive an unhide. Two surfaces apply it two ways — see the `hide` strategy
 * on each registry descriptor — but this table is the record of the decision in
 * both cases, so "why is this gone?" has one answer.
 */
export const boffMediaContentModeration = mysqlTable(
  'boffmedia_content_moderation',
  {
    id: int('id').primaryKey().autoincrement(),
    contentType: varchar('content_type', { length: 32 }).notNull(),
    contentId: varchar('content_id', { length: 64 }).notNull(),
    hiddenAt: timestamp('hidden_at'),
    hiddenByUserId: int('hidden_by_user_id'),
    hiddenReason: varchar('hidden_reason', { length: 200 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    hiddenByFk: foreignKey({
      columns: [t.hiddenByUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bcm_hidden_by_fk',
    }).onDelete('set null'),
    // Unique so the read-side filter is a point lookup and so an unhide can
    // never race a second hide into a duplicate row.
    contentUq: uniqueIndex('bcm_content_uq').on(t.contentType, t.contentId),
  }),
);

export type ContentModeration = typeof boffMediaContentModeration.$inferSelect;

export const SANCTION_KIND = {
  /** Recorded and notified; costs the author nothing but a message. */
  WARNING: 'warning',
  /** Blocks creating new content until `expires_at` (NULL = indefinite). */
  CONTENT_BAN: 'content_ban',
} as const;

export type SanctionKind = (typeof SANCTION_KIND)[keyof typeof SANCTION_KIND];

/**
 * What was done to the author, as opposed to what was done to the post.
 *
 * Kept apart from `boffmedia_content_moderation` because it outlives any single
 * item: the second offence is only visible as a second offence if the first one
 * is still on the record after its post was hidden. `revoked_at` rather than a
 * delete, for the same reason.
 *
 * Two subject columns for the same reason the report has two author columns —
 * a Rooker author may have no website account at all.
 */
export const boffMediaModerationSanctions = mysqlTable(
  'boffmedia_moderation_sanctions',
  {
    id: int('id').primaryKey().autoincrement(),
    subjectUserId: int('subject_user_id'),
    subjectUuid: char('subject_uuid', { length: 36 }),
    kind: mysqlEnum('kind', [
      SANCTION_KIND.WARNING,
      SANCTION_KIND.CONTENT_BAN,
    ]).notNull(),
    reason: varchar('reason', { length: 200 }).notNull(),
    /** The report this came out of, when it came out of one. */
    reportId: int('report_id'),
    /** NULL on a content ban means indefinite; unused by a warning. */
    expiresAt: timestamp('expires_at'),
    revokedAt: timestamp('revoked_at'),
    revokedByUserId: int('revoked_by_user_id'),
    issuedByUserId: int('issued_by_user_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    subjectFk: foreignKey({
      columns: [t.subjectUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bms_subject_fk',
    }).onDelete('restrict'),
    subjectUuidFk: foreignKey({
      columns: [t.subjectUuid],
      foreignColumns: [rotomUsers.uuid],
      name: 'bms_subject_uuid_fk',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    reportFk: foreignKey({
      columns: [t.reportId],
      foreignColumns: [boffMediaContentReports.id],
      name: 'bms_report_fk',
    }).onDelete('set null'),
    issuerFk: foreignKey({
      columns: [t.issuedByUserId],
      foreignColumns: [boffMediaUsers.id],
      name: 'bms_issuer_fk',
    }).onDelete('set null'),
    // The enforcement query: "does this account have a live content ban?"
    subjectIdx: index('bms_subject_idx').on(t.subjectUserId, t.revokedAt),
    subjectUuidIdx: index('bms_subject_uuid_idx').on(
      t.subjectUuid,
      t.revokedAt,
    ),
  }),
);

export type ModerationSanction =
  typeof boffMediaModerationSanctions.$inferSelect;
