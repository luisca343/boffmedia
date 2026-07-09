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
  profilePicture: varchar('profilePicture', { length: 255 })
    .notNull()
    .default('https://cdn.boffmedia.es/default-profile.png'),
  coverImage: varchar('coverImage', { length: 255 }),
  bio: text('bio'),
  googleId: varchar('googleId', { length: 255 }).unique(),
  discordId: varchar('discordId', { length: 255 }).unique(),
  twitchId: varchar('twitchId', { length: 255 }).unique(),
  steamId: varchar('steamId', { length: 255 }).unique(),
  // Credential sign-ups start unverified; OAuth (Google) accounts are verified
  // on creation. Existing rows are backfilled to true by migration 0009.
  emailVerified: boolean('emailVerified').notNull().default(false),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .defaultNow()
    .onUpdateNow(),
  // GDPR soft-delete: set (with PII scrubbed) instead of hard-deleting. All
  // reads/login exclude rows where this is non-null.
  deletedAt: timestamp('deletedAt', { mode: 'date' }),
});

export type BoffMediaUser = typeof boffMediaUsers.$inferSelect;

export const boffMediaRoles = mysqlTable('boffmedia_roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull().unique(),
});

export type BoffMediaPermission = typeof boffMediaRoles.$inferSelect;

export const boffMediaUserRoles = mysqlTable('boffmedia_user_roles', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId')
    .notNull()
    .references(() => boffMediaUsers.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  roleId: int('roleId')
    .notNull()
    .references(() => boffMediaRoles.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
});

export type BoffMediaUserPermission = typeof boffMediaUserRoles.$inferSelect;
