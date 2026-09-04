import { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';
import { sql, SQL } from 'drizzle-orm';
import {
  boffMediaForumPosts,
  boffMediaForumThreads,
} from '@/_db/schema/BoffMediaForum';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { rookerPosts } from '@/_db/schema/SmartRotomRooker';
import {
  REPORTABLE_CONTENT,
  ReportableContentType,
} from '@/_db/schema/BoffMediaModeration';

/**
 * How a surface's content is taken out of view.
 *
 * `column` — the surface already has a soft-hide column and already filters on
 * it everywhere, so moderation writes that column and no read path changes.
 * `ledger` — the surface has no such column, so the hide lives only in
 * `boffmedia_content_moderation` and that surface's read paths must consult it
 * through `notHidden()` below.
 *
 * The trap in `column`, written down because it is invisible at the call site:
 * on the forum the column is `deleted_at`, which the AUTHOR can also set. An
 * unhide therefore restores a row the author may have since tried to delete.
 * That is why `unhide` refuses unless `boffmedia_content_moderation` says we
 * were the ones who hid it — the ledger, not the column, is the record of who
 * decided what.
 */
export type HideStrategy = 'column' | 'ledger';

/**
 * Everything the moderation module needs to know about one UGC surface.
 *
 * This is the registration that replaces a per-surface implementation. Adding
 * the next surface means adding one entry to `CONTENT_SURFACES` and — only when
 * `hide` is `'ledger'` — one `notHidden()` clause in that surface's read
 * queries. No new table, no new endpoint, no new admin screen.
 */
export interface ContentSurface {
  readonly contentType: ReportableContentType;
  /** The Drizzle table the content lives in. */
  readonly table: MySqlTable;
  /** Its primary key column, used to resolve one item. */
  readonly idColumn: AnyMySqlColumn;
  /**
   * `content_id` is a varchar for every surface (the PKs are not one type), so
   * each surface says how to read its own id back. Returning `null` means the
   * id is malformed for this surface and the lookup must not run at all.
   */
  readonly parseId: (raw: string) => number | string | null;
  /** The author's website account, when the surface stores one. */
  readonly authorUserIdColumn?: AnyMySqlColumn;
  /** The author's in-game uuid, when that is the identity the surface uses. */
  readonly authorUuidColumn?: AnyMySqlColumn;
  /** Columns whose text the queue shows the admin, in display order. */
  readonly excerptColumns: readonly AnyMySqlColumn[];
  /** When the content was posted, for the queue's age column. */
  readonly createdAtColumn?: AnyMySqlColumn;
  readonly hide: HideStrategy;
  /**
   * Only for `hide: 'column'` — the nullable column that takes the content out
   * of view when it holds a value.
   */
  readonly hideColumn?: AnyMySqlColumn;
}

/**
 * The registered surfaces.
 *
 * Not registered, and why — these were checked, not overlooked:
 *
 * * **Event suggestions** (`boffmedia_event_suggestions`). Named by the audit,
 *   but nothing about it is post-moderation: only admins can read the list, and
 *   the row already carries a `pending | approved | rejected` status that IS an
 *   approval queue. A report on content no other user can see adds nothing.
 * * **Wigglypop listings** (`rotom_wigglypop_listings`). Public and reportable
 *   in principle, but `status` is a trading lifecycle (`activo`, `vendido`…),
 *   not a visibility flag, so hiding through it would corrupt the sale state
 *   and unhiding would restore the wrong one. It needs a `ledger` hide and the
 *   in-game read paths to consult it — a registration, once someone wants it.
 * * **Chat, FicusAI, notes, tournament match messages.** Private or
 *   two-party; there is no audience to protect, and a queue full of private
 *   messages is a privacy problem of its own.
 * * **Sharex images, Discord quotes.** Neither is written through a signed-in
 *   website session, so neither has a reporter to key on today.
 */
export const CONTENT_SURFACES: readonly ContentSurface[] = [
  {
    contentType: REPORTABLE_CONTENT.FORUM_THREAD,
    table: boffMediaForumThreads,
    idColumn: boffMediaForumThreads.id,
    parseId: parseIntId,
    authorUserIdColumn: boffMediaForumThreads.userId,
    excerptColumns: [boffMediaForumThreads.title],
    createdAtColumn: boffMediaForumThreads.createdAt,
    hide: 'column',
    hideColumn: boffMediaForumThreads.deletedAt,
  },
  {
    contentType: REPORTABLE_CONTENT.FORUM_POST,
    table: boffMediaForumPosts,
    idColumn: boffMediaForumPosts.id,
    parseId: parseIntId,
    authorUserIdColumn: boffMediaForumPosts.userId,
    excerptColumns: [boffMediaForumPosts.body],
    createdAtColumn: boffMediaForumPosts.createdAt,
    hide: 'column',
    hideColumn: boffMediaForumPosts.deletedAt,
  },
  {
    contentType: REPORTABLE_CONTENT.ROOKER_POST,
    table: rookerPosts,
    idColumn: rookerPosts.id,
    parseId: parseIntId,
    // Rooker is in-game identity only: its authors may have no website account.
    authorUuidColumn: rookerPosts.uuid,
    excerptColumns: [rookerPosts.text, rookerPosts.mediaUrl],
    createdAtColumn: rookerPosts.createdAt,
    hide: 'ledger',
  },
  {
    contentType: REPORTABLE_CONTENT.USER_PROFILE,
    table: boffMediaUsers,
    idColumn: boffMediaUsers.id,
    parseId: parseIntId,
    authorUserIdColumn: boffMediaUsers.id,
    excerptColumns: [boffMediaUsers.bio],
    createdAtColumn: boffMediaUsers.createdAt,
    // A profile has no hide column and must not get one: hiding an account is
    // not the same decision as hiding its bio. The ledger hides the bio; the
    // account keeps working.
    hide: 'ledger',
  },
];

const BY_TYPE = new Map<string, ContentSurface>(
  CONTENT_SURFACES.map((s) => [s.contentType, s]),
);

/** The registered surface for a `content_type`, or `undefined` if unknown. */
export function findSurface(
  contentType: string,
): ContentSurface | undefined {
  return BY_TYPE.get(contentType);
}

export function isReportableContentType(
  value: string,
): value is ReportableContentType {
  return BY_TYPE.has(value);
}

/** Every registered `content_type`, for validation and for the admin filter. */
export const REPORTABLE_CONTENT_TYPES: readonly ReportableContentType[] =
  CONTENT_SURFACES.map((s) => s.contentType);

/**
 * A `WHERE` clause a `ledger`-hidden surface adds to its read queries.
 *
 * The `CAST(... AS CHAR)` is load-bearing. `content_id` is a varchar and the
 * surface's id is usually an `int`; comparing them directly makes MySQL
 * convert BOTH sides to a number, which throws away the
 * `(content_type, content_id)` index and turns a point lookup into a scan of
 * the whole moderation table per row. Casting the int side keeps the
 * comparison in the index's own type.
 */
export function notHidden(idColumn: AnyMySqlColumn): SQL {
  return sql`NOT ${isHidden(idColumn)}`;
}

/**
 * The same lookup, positive. Used where the row must still be returned with
 * part of it blanked — a profile whose bio was hidden is still a profile.
 */
export function isHidden(idColumn: AnyMySqlColumn): SQL {
  return sql`EXISTS (
    SELECT 1 FROM \`boffmedia_content_moderation\` cm
    WHERE cm.\`content_type\` = ${surfaceTypeFor(idColumn)}
      AND cm.\`content_id\` = CAST(${idColumn} AS CHAR)
      AND cm.\`hidden_at\` IS NOT NULL
  )`;
}

/**
 * Resolves the `content_type` from the id column a caller passed, so a read
 * path cannot filter Rooker's rows against a profile's hide decisions by
 * mistyping a string. Throws at boot-time-ish call sites rather than returning
 * a filter that silently matches nothing.
 */
function surfaceTypeFor(idColumn: AnyMySqlColumn): string {
  const surface = CONTENT_SURFACES.find((s) => s.idColumn === idColumn);
  if (!surface) {
    throw new Error(
      `notHidden() called with a column that belongs to no registered surface: ${String(
        idColumn.name,
      )}`,
    );
  }
  return surface.contentType;
}

function parseIntId(raw: string): number | null {
  // `Number('')` is 0 and `Number('12abc')` is NaN — both have to be rejected,
  // because a 0 would happily match nothing while a NaN reaches the driver as
  // a literal and fails the query instead of the request.
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
