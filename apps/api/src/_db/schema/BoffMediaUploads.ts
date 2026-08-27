import {
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';

/**
 * Who uploaded which file.
 *
 * Before this table there was no owner anywhere: `DELETE /upload/file` and
 * `GET /upload/info` took a path plus a filename from any signed-in caller and
 * acted on whatever was there, so one user could delete another's avatar simply
 * by naming it. Ownership could not live on disk — the filesystem has no notion
 * of a Boffmedia user — so it has to be a row.
 *
 * `subdir` is `''` rather than NULL for a file at the uploads root, because the
 * unique below has to treat "root" as one value: MySQL permits unlimited NULLs
 * in a UNIQUE index, which would let the same root filename be registered any
 * number of times.
 *
 * Files written before this table exists have no row. They are treated as
 * **legacy and admin-only** rather than unowned-so-anyone-may-delete — see
 * `FileUploadService`. That is deliberately the restrictive reading: the
 * alternative silently keeps the hole open for every file already on disk.
 */
export const boffMediaUploads = mysqlTable(
  'boffmedia_uploads',
  {
    id: int('id').primaryKey().autoincrement(),
    ownerUserId: int('owner_user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    /** Validated subdirectory, `''` for the uploads root. Never user-shaped. */
    subdir: varchar('subdir', { length: 128 }).notNull().default(''),
    filename: varchar('filename', { length: 128 }).notNull(),
    mimetype: varchar('mimetype', { length: 100 }).notNull(),
    size: int('size').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    /**
     * Set when the file is removed. The row outlives the bytes so a later
     * re-upload to the same location cannot silently inherit the old owner, and
     * so an orphan sweep can tell "deleted on purpose" from "never registered".
     */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => ({
    ownerIdx: index('bu_owner_idx').on(t.ownerUserId),
    locationUq: uniqueIndex('bu_location_uq').on(t.subdir, t.filename),
  }),
);

export type BoffMediaUpload = typeof boffMediaUploads.$inferSelect;
