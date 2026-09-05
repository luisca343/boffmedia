import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/**
 * One row per "give me everything you hold on me" request (GDPR art. 15/20).
 *
 * The request is a ROW rather than a synchronous response because the answer
 * spans ~50 tables across two identities (the website account and, when linked,
 * the Minecraft one). Doing that inside the HTTP request means a 30-second POST
 * that a proxy will cut, so the controller records intent here, enqueues an
 * outbox job, and the browser polls this row.
 *
 * The archive is written to disk (`dataExportPath()`), NOT under `uploadsPath()`:
 * uploads are served statically at `/uploads`, and this file is the single most
 * concentrated pile of one person's data the system can produce. It is only ever
 * handed back through an authenticated route that re-checks ownership.
 */
export const EXPORT_STATUS = {
  /** Enqueued; the outbox dispatcher has not built it yet. */
  PENDING: 'pending',
  /** Built and downloadable until `expires_at`. */
  READY: 'ready',
  /** The build threw. `last_error` says what; the user may request again. */
  FAILED: 'failed',
  /** Past `expires_at` — the bytes are gone, the row stays as the receipt. */
  EXPIRED: 'expired',
} as const;

export type ExportStatus = (typeof EXPORT_STATUS)[keyof typeof EXPORT_STATUS];

export const boffMediaDataExports = mysqlTable(
  'boffmedia_data_exports',
  {
    id: int('id').primaryKey().autoincrement(),
    // `cascade`: the export request has no meaning without the account, and the
    // erasure job deletes the FILE before it deletes the user, so the cascade
    // never leaves an orphaned archive on disk. See `UserErasureService`.
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    status: mysqlEnum('status', [
      EXPORT_STATUS.PENDING,
      EXPORT_STATUS.READY,
      EXPORT_STATUS.FAILED,
      EXPORT_STATUS.EXPIRED,
    ])
      .notNull()
      .default(EXPORT_STATUS.PENDING),
    /**
     * Basename only, never a path: the download route joins it onto
     * `dataExportPath()` itself, so a value that somehow acquired a `..` still
     * cannot escape the directory (the join is also re-checked there).
     */
    filename: varchar('filename', { length: 128 }),
    sizeBytes: int('size_bytes'),
    lastError: text('last_error'),
    requestedAt: timestamp('requested_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    /** When the bytes stop being downloadable. Set at build time, not request time. */
    expiresAt: timestamp('expires_at'),
  },
  (t) => ({
    // The cooldown check and the status poll both read "this user's most recent
    // request", which is exactly this index.
    userRequestedIdx: index('bde_user_requested_idx').on(
      t.userId,
      t.requestedAt,
    ),
    statusIdx: index('bde_status_idx').on(t.status),
  }),
);

export type DataExport = typeof boffMediaDataExports.$inferSelect;
