import {
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/**
 * Single-use password-reset tokens. Only the SHA-256 hash of the token is
 * stored — the raw token lives solely in the emailed link. A row is spent by
 * setting `used_at`; issuing a new token invalidates the user's prior ones.
 */
export const boffMediaPasswordResetTokens = mysqlTable(
  'boffmedia_password_reset_tokens',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index('prt_token_idx').on(t.tokenHash),
    userIdx: index('prt_user_idx').on(t.userId),
  }),
);

export type PasswordResetToken =
  typeof boffMediaPasswordResetTokens.$inferSelect;

/**
 * Single-use email-verification tokens. Same hashed-token discipline as the
 * reset tokens. `email` captures the address being verified at issue time.
 */
export const boffMediaEmailVerifications = mysqlTable(
  'boffmedia_email_verifications',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    email: varchar('email', { length: 255 }).notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index('ev_token_idx').on(t.tokenHash),
    userIdx: index('ev_user_idx').on(t.userId),
  }),
);

export type EmailVerification = typeof boffMediaEmailVerifications.$inferSelect;
