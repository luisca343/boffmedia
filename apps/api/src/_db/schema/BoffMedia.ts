import {
  boolean,
  char,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

export const boffMediaUsers = mysqlTable('boffmedia_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  // Nullable: OAuth-only accounts (Google/Discord/Steam) have no local password.
  password: varchar('password', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  uuid: char('uuid', { length: 36 }).references(() => smartrotomUsers.uuid, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  profilePicture: varchar('profile_picture', { length: 255 })
    .notNull()
    .default('https://cdn.boffmedia.es/default-profile.png'),
  coverImage: varchar('cover_image', { length: 255 }),
  bio: text('bio'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  discordId: varchar('discord_id', { length: 255 }).unique(),
  twitchId: varchar('twitch_id', { length: 255 }).unique(),
  steamId: varchar('steam_id', { length: 255 }).unique(),
  // Credential sign-ups start unverified; OAuth (Google) accounts are verified
  // on creation. Existing rows are backfilled to true by migration 0009.
  emailVerified: boolean('email_verified').notNull().default(false),
  // Stored language preference, used for server-composed text the browser
  // cannot translate (transactional emails). NULL = never chosen, falls back
  // to Spanish. Deliberately NOT request Accept-Language: that is wrong for
  // anything the user did not trigger from a browser.
  locale: varchar('locale', { length: 8 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .onUpdateNow(),
  lastSeenAt: timestamp('last_seen_at'),
  // GDPR soft-delete: set (with PII scrubbed) instead of hard-deleting. All
  // reads/login exclude rows where this is non-null.
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
});

export type BoffMediaUser = typeof boffMediaUsers.$inferSelect;

export const boffMediaRoles = mysqlTable('boffmedia_roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull().unique(),
});

export type BoffMediaPermission = typeof boffMediaRoles.$inferSelect;

export const boffMediaUserRoles = mysqlTable('boffmedia_user_roles', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id')
    .notNull()
    .references(() => boffMediaUsers.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  roleId: int('role_id')
    .notNull()
    .references(() => boffMediaRoles.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
});

export type BoffMediaUserPermission = typeof boffMediaUserRoles.$inferSelect;
