import {
  char,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/**
 * One row per person who may upload through ShareX.
 *
 * `POST /sharex` cannot carry a session — the uploader is a desktop tool, not a
 * browser — so the token IS the identity. It used to be a single shared secret
 * in the environment, which authenticated everyone as nobody: an upload could
 * not be traced to a person, and revoking one person's access meant rotating the
 * secret for everybody.
 *
 * The plaintext token is never stored. Only its SHA-256 lives here, so a dump of
 * this table does not hand anyone upload access.
 */
export const sharexTokens = mysqlTable(
  'boffmedia_sharex_tokens',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Who holds it, for the admin list — "Luisca desktop", "Aquiles". */
    label: varchar('label', { length: 64 }).notNull(),
    /** SHA-256 hex of the plaintext token. 64 chars, never the token itself. */
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    /** The Boffmedia account that issued it. Null for tokens made by a script. */
    createdBy: int('created_by').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    /** Last upload accepted with this token — how a stale token is spotted. */
    usedAt: timestamp('used_at'),
    /** Revocation is a soft delete: a revoked token must stay joinable from the
     *  images it already uploaded, so the row is never actually removed. */
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    tokenHashUq: uniqueIndex('sxt_token_hash_uq').on(t.tokenHash),
  }),
);

export const sharexImages = mysqlTable('boffmedia_sharex_images', {
  id: int('id').primaryKey().autoincrement(),
  app: varchar('app', { length: 32 }).notNull(),
  name: char('name', { length: 10 }).notNull(),
  extension: varchar('extension', { length: 4 }).notNull(),
  /** Who uploaded it. Null on rows predating tokens, when the shared secret
   *  identified nobody. */
  tokenId: int('token_id').references(() => sharexTokens.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  /** Legacy: the raw shared secret the client sent, stored unvalidated. Kept
   *  nullable so historical rows survive; nothing writes it any more. */
  key: char('key', { length: 32 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type SharexToken = typeof sharexTokens.$inferSelect;
export type NewSharexToken = typeof sharexTokens.$inferInsert;
export type SharexImage = typeof sharexImages.$inferSelect;
