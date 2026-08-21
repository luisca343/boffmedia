import {
  boolean,
  char,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

export const boffMediaUsers = mysqlTable('boffmedia_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  // Nullable: OAuth-only accounts (Google/Discord/Steam) have no local password.
  password: varchar('password', { length: 255 }),
  // Unique: every credential flow (login, password reset, email verification)
  // keys on it. Soft-delete scrubs the column to `deleted+<id>@deleted.invalid`,
  // which is unique per row, so tombstones never collide here.
  email: varchar('email', { length: 255 }).notNull().unique(),
  // Link to the in-game (SmartRotom/Minecraft) identity. Deliberately
  // `set null`, NOT cascade: the website account is the durable record and must
  // survive its game identity being removed. Cascading here meant deleting one
  // `rotom_users` row silently destroyed the person's whole Boffmedia account —
  // forum posts, events, packs and grants — through the FKs hanging off it.
  uuid: char('uuid', { length: 36 }).references(() => rotomUsers.uuid, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  // Mirrors DEFAULT_PROFILE_PICTURE in api/boffmedia/users/users.constants.ts —
  // a SQL default cannot call into application code, so the value is repeated.
  profilePicture: varchar('profile_picture', { length: 255 })
    .notNull()
    .default('/boffmedia/img/profile.png'),
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
  // Coarse revocation counter for desktop-app sessions. Every app JWT embeds
  // the value at mint time; the guard rejects a token whose embedded value no
  // longer matches. Incrementing it invalidates every outstanding session at once.
  desktopTokenVersion: int('desktop_token_version').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
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

export type BoffMediaRole = typeof boffMediaRoles.$inferSelect;

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

export type BoffMediaUserRole = typeof boffMediaUserRoles.$inferSelect;
