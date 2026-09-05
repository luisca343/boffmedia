import {
  index,
  uniqueIndex,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

export const NOTIFICATION_TYPE = {
  EVENT: 'event',
  ACHIEVEMENT: 'achievement',
  TOURNAMENT: 'tournament',
  SYSTEM: 'system',
  // Appended last on purpose: MySQL stores ENUM by ordinal position, so a new
  // value must go at the end to avoid remapping existing rows (migration 0017).
  FORUM: 'forum',
} as const;

export const boffMediaNotifications = mysqlTable(
  'boffmedia_notifications',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    type: mysqlEnum('type', [
      NOTIFICATION_TYPE.EVENT,
      NOTIFICATION_TYPE.ACHIEVEMENT,
      NOTIFICATION_TYPE.TOURNAMENT,
      NOTIFICATION_TYPE.SYSTEM,
      NOTIFICATION_TYPE.FORUM,
    ])
      .notNull()
      .default(NOTIFICATION_TYPE.SYSTEM),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    link: varchar('link', { length: 512 }),
    readAt: timestamp('read_at'),
    /**
     * Optional idempotency key, e.g. `tournament:12:champion:34`. NULL means
     * "never deduplicate" — MySQL allows many NULLs in a UNIQUE index, so an
     * unkeyed notification behaves exactly as before. Producers that can be
     * retried (a re-run advance, a redelivered job) pass one so the second
     * attempt updates the existing row instead of creating a twin.
     */
    dedupeKey: varchar('dedupe_key', { length: 120 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('notif_user_idx').on(t.userId),
    userReadIdx: index('notif_user_read_idx').on(t.userId, t.readAt),
    dedupeUq: uniqueIndex('notif_dedupe_uq').on(t.dedupeKey),
  }),
);

export type Notification = typeof boffMediaNotifications.$inferSelect;

/**
 * Per-user, per-notification-type preferences.
 * Defaults to "everything on" when no row exists, so existing users are unaffected.
 * One row per (user, type) pair; a missing row means no mute/opt-out.
 *
 * Note: An email opt-out field was deliberately not shipped because no notification email
 * path exists yet. If adding one, include the column WITH the email sender, not separately.
 */
export const boffMediaNotificationPreferences = mysqlTable(
  'boffmedia_notification_preferences',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    type: mysqlEnum('type', [
      NOTIFICATION_TYPE.EVENT,
      NOTIFICATION_TYPE.ACHIEVEMENT,
      NOTIFICATION_TYPE.TOURNAMENT,
      NOTIFICATION_TYPE.SYSTEM,
      NOTIFICATION_TYPE.FORUM,
    ]).notNull(),
    isMuted: boolean('is_muted').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    userTypeUq: uniqueIndex('bnp_user_type_uq').on(t.userId, t.type),
    userIdx: index('bnp_user_idx').on(t.userId),
  }),
);

export type NotificationPreference =
  typeof boffMediaNotificationPreferences.$inferSelect;
export type NewNotificationPreference = Omit<
  NotificationPreference,
  'id' | 'createdAt' | 'updatedAt'
>;
