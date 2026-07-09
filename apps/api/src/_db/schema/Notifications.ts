import {
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { boffMediaUsers } from './BoffMedia';

export const NOTIFICATION_TYPE = {
  EVENT: 'event',
  ACHIEVEMENT: 'achievement',
  TOURNAMENT: 'tournament',
  SYSTEM: 'system',
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
    ])
      .notNull()
      .default(NOTIFICATION_TYPE.SYSTEM),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    link: varchar('link', { length: 512 }),
    readAt: datetime('read_at'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (t) => ({
    userIdx: index('notif_user_idx').on(t.userId),
    userReadIdx: index('notif_user_read_idx').on(t.userId, t.readAt),
  }),
);

export type Notification = typeof boffMediaNotifications.$inferSelect;
