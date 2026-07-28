import { sql } from 'drizzle-orm';
import {
  char,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const rotomUsers = mysqlTable('rotom_users', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 }).notNull().unique(),
  username: varchar('username', { length: 32 }).notNull(),
  world: varchar('world', { length: 36 }),
  energy: int('energy').default(10),
  lastCharge: timestamp('last_charge')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
});

export type RotomUser = typeof rotomUsers.$inferSelect;

export const rotomApps = mysqlTable('rotom_apps', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull(),
  url: varchar('url', { length: 255 }),
  active: int('active').default(1),
});

export type RotomApp = typeof rotomApps.$inferSelect;

export const rotomUserApps = mysqlTable(
  'rotom_user_apps',
  {
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    appId: int('app_id')
      .notNull()
      .references(() => rotomApps.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    order: int('order').default(999),
  },
  // A user holds an app once. Shipped without a PK, so duplicates were possible
  // and upserts had nothing to key on (migration 0036).
  (table) => ({
    pk: primaryKey({ columns: [table.uuid, table.appId] }),
  }),
);

export type RotomUserApp = typeof rotomUserApps.$inferSelect;

export const ACHIEVEMENT_TIERS = ['bronce', 'plata', 'oro', 'platino'] as const;
export type AchievementTier = (typeof ACHIEVEMENT_TIERS)[number];

export const rotomAchievements = mysqlTable('rotom_achievements', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  category: varchar('category', { length: 32 }).notNull(),
  subcategory: varchar('subcategory', { length: 32 }),
  target: int('target').default(1),
  order: int('order').default(0),
  points: int('points').default(10),
  tier: varchar('tier', { length: 16 }).default('bronce'),
});

export type RotomAchievement = typeof rotomAchievements.$inferSelect;

export const rotomUserAchievements = mysqlTable(
  'rotom_user_achievements',
  {
    achievementId: varchar('achievement_id', { length: 32 })
      .notNull()
      .references(() => rotomAchievements.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    progress: int('progress').default(0),
    completed: int('completed').default(0),
    completedAt: timestamp('completed_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`)
      .onUpdateNow(),
    dataId: int('data_id').default(0),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.achievementId, table.uuid] }),
    };
  },
);

export type RotomUserAchievement = typeof rotomUserAchievements.$inferSelect;

export const rotomReplays = mysqlTable('rotom_replays', {
  id: int('id').primaryKey().autoincrement(),
  side1: varchar('side1', { length: 36 }).notNull(),
  side2: varchar('side2', { length: 36 }).notNull(),
  team1: text('team1'),
  team2: text('team2'),
  replay: text('replay').notNull(),
  winner: varchar('winner', { length: 36 }),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
});

export type RotomReplay = typeof rotomReplays.$inferSelect;

export const rotomUserReplays = mysqlTable(
  'rotom_user_replays',
  {
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    replayId: int('replay_id')
      .notNull()
      .references(() => rotomReplays.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    side: int('side').default(1),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.uuid, table.replayId] }),
    };
  },
);

export type RotomUserReplay = typeof rotomUserReplays.$inferSelect;

export const rotomArceuSpeak = mysqlTable('rotom_arceuspeak', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull(),
  value: varchar('value', { length: 32 }).notNull(),
  format: varchar('format', { length: 32 }).notNull(),
});

export type RotomArceuSpeak = typeof rotomArceuSpeak.$inferSelect;

export const rotomArcadeStreaks = mysqlTable('rotom_arcade_streaks', {
  id: int('id').primaryKey().autoincrement(),
  uuid: varchar('uuid', { length: 36 }).notNull(),
  lastClaimed: timestamp('last_claimed')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`)
    .onUpdateNow(),
  lastBanner: varchar('last_banner', { length: 100 }),
  streak: int('streak').default(0),
  totalClaims: int('total_claims').default(0),
});

export type RotomArcadeStreak = typeof rotomArcadeStreaks.$inferSelect;

export const rotomInventory = mysqlTable('rotom_inventory', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  // 256, not 32: mod item ids are namespaced and already reach 173 chars live.
  itemId: varchar('item_id', { length: 256 }).notNull(),
  itemData: varchar('item_data', { length: 512 }),
  itemType: varchar('item_type', { length: 32 }).notNull(),
  amount: int('amount').default(1),
  sourceType: varchar('source_type', { length: 32 }),
  used: int('used').default(0),
  rarity: varchar('rarity', { length: 20 })
    .$type<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'>()
    .default('common'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
  // Two-phase caja delivery (DARCAJA.md §7). A row is *reserved* — soft-locked for
  // an in-flight grant — when reservationId is set and it is not yet spent
  // (amount > used). `confirm` turns a reservation into a spend; an unconfirmed
  // reservation older than the TTL is reclaimable, so a lost delivery is not a lost
  // reward. `used` alone stays the single-use gate — reservation never touches it.
  reservationId: varchar('reservation_id', { length: 36 }),
  reservedAt: timestamp('reserved_at'),
});

export type RotomInventoryItem = typeof rotomInventory.$inferSelect;

export const rotomNotifications = mysqlTable('rotom_notifications', {
  id: int('id').primaryKey().autoincrement(),
  userUuid: char('user_uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  type: varchar('type', { length: 64 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  link: varchar('link', { length: 512 }),
  isRead: int('is_read').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
});

export type RotomNotification = typeof rotomNotifications.$inferSelect;
export type NewRotomNotification = typeof rotomNotifications.$inferInsert;
