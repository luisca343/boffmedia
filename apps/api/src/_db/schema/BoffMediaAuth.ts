import {
  char,
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

/**
 * Refresh-token families — the storage behind rotation and reuse detection.
 *
 * A refresh token used to be a bearer credential with a 7-day life and nothing
 * else: stealing one bought a week of silent, parallel access next to the
 * legitimate holder, because nothing invalidated the token that had just been
 * exchanged and nothing noticed it being used twice.
 *
 * One row per ISSUED jti. `family_id` is the lineage: it is minted at login and
 * survives every rotation, so the whole chain descending from one sign-in can be
 * killed together. `rotated_at` is the single-use latch — the exchange claims it
 * with `UPDATE … WHERE jti = ? AND rotated_at IS NULL`, so two racing requests
 * cannot both spend the same token no matter how they interleave.
 *
 * The token itself is NOT stored. The jti is a random uuid the JWT carries in
 * the clear, and the signature is what proves the bearer holds the real token —
 * so a dump of this table leaks a session graph, never a usable credential.
 */
export const boffMediaRefreshTokens = mysqlTable(
  'boffmedia_refresh_tokens',
  {
    id: int('id').primaryKey().autoincrement(),
    /** The `jti` claim of exactly one issued refresh token. */
    jti: char('jti', { length: 36 }).notNull().unique(),
    /** Constant across the whole rotation chain from one sign-in. */
    familyId: char('family_id', { length: 36 }).notNull(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    /** Mirrors the JWT `exp`, so the sweeper can drop the row exactly when the
     *  token stops being presentable. */
    expiresAt: timestamp('expires_at').notNull(),
    /** Set the moment this jti is exchanged. Non-null = already spent, and a
     *  second presentation is the theft signal. */
    rotatedAt: timestamp('rotated_at'),
    /** Set on EVERY row of the family when reuse is detected. A revoked family
     *  is refused even for its still-unrotated tokens. */
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    familyIdx: index('rt_family_idx').on(t.familyId),
    userIdx: index('rt_user_idx').on(t.userId),
    expiresIdx: index('rt_expires_idx').on(t.expiresAt),
  }),
);

export type RefreshTokenRow = typeof boffMediaRefreshTokens.$inferSelect;

/**
 * TOTP enrolment, one row per account (RFC 6238, 30-second step, 6 digits).
 *
 * The shared secret is the whole factor, so it is stored ENCRYPTED (AES-256-GCM,
 * see `_utils/crypto/secret-box.ts`) rather than in the clear: unlike a password
 * hash it has to be recoverable to verify a code, so the protection has to be a
 * key the database dump does not contain.
 *
 * `pending_secret` holds an enrolment that has not proved itself yet. Writing
 * straight into `secret` would lock an admin out of their own account the moment
 * they opened the QR and closed the tab — the secret only becomes the live
 * factor once a code generated from it verifies.
 */
export const boffMediaUserTotp = mysqlTable('boffmedia_user_totp', {
  userId: int('user_id')
    .primaryKey()
    .references(() => boffMediaUsers.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  /** Active factor, encrypted. NULL until an enrolment is confirmed. */
  secret: varchar('secret', { length: 255 }),
  /** Unconfirmed enrolment, encrypted. Cleared when confirmed or restarted. */
  pendingSecret: varchar('pending_secret', { length: 255 }),
  confirmedAt: timestamp('confirmed_at'),
  /**
   * The last TOTP counter step accepted for this account. A code is valid for a
   * whole 30-second window, so without this the same six digits — shoulder-surfed,
   * or read out of a phished form — are replayable for the rest of that window.
   */
  lastStep: int('last_step'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type UserTotp = typeof boffMediaUserTotp.$inferSelect;

/**
 * Single-use backup codes — the way back in when the authenticator device is
 * gone. Only the SHA-256 hash is stored, the same discipline as the reset and
 * verification tokens above; the plaintext is shown exactly once, at enrolment.
 *
 * SHA-256 rather than bcrypt on purpose: these are 10 random base32 characters
 * (~50 bits) generated by us, not a human-chosen password, so there is no
 * dictionary for a work factor to defend against — and a login must be able to
 * check ten of them without ten bcrypt rounds.
 */
export const boffMediaUserBackupCodes = mysqlTable(
  'boffmedia_user_backup_codes',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    codeHash: char('code_hash', { length: 64 }).notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('ubc_user_idx').on(t.userId),
  }),
);

export type UserBackupCode = typeof boffMediaUserBackupCodes.$inferSelect;
