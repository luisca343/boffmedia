import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNotNull, lt, ne } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { boffMediaUploads } from '@/_db/schema/BoffMediaUploads';
import {
  boffMediaForumPosts,
  boffMediaForumThreads,
} from '@/_db/schema/BoffMediaForum';
import {
  boffMediaContentReports,
  boffMediaModerationSanctions,
} from '@/_db/schema/BoffMediaModeration';

/**
 * The account an erased user's forum history is re-pointed at.
 *
 * It is itself soft-deleted, so every read path already hides it, and
 * {@link UserErasureRepository.findDueForErasure} excludes it by id — otherwise
 * the very first sweep would try to erase the row that every erased account's
 * forum history now hangs off.
 */
export const TOMBSTONE_USERNAME = 'deleted_account';
const TOMBSTONE_EMAIL = 'deleted@deleted.invalid';

/**
 * Hard deletion of accounts whose soft-delete grace period has run out
 * (see `UserErasureService`).
 *
 * ## Why this is not one DELETE
 *
 * Most of the ~40 children of `boffmedia_users` are ON DELETE CASCADE, so the
 * database does the work. Four are RESTRICT, and a RESTRICT is not an oversight
 * here — `_db/schema/_fk-actions.spec.ts` pins each one because the content has
 * to outlive its author:
 *
 * | reference                                        | why it restricts        | what we do |
 * |--------------------------------------------------|-------------------------|------------|
 * | `boffmedia_forum_threads.user_id`   (NOT NULL)   | a thread with replies   | reassign   |
 * | `boffmedia_forum_posts.user_id`     (NOT NULL)   | a reply inside a thread | reassign   |
 * | `boffmedia_content_reports.reporter_user_id` (NN)| the report is an act    | delete     |
 * | `boffmedia_moderation_sanctions.subject_user_id` | a ban outliving the account | NULL |
 *
 * The two forum references are NOT NULL, so NULL is not available and the row
 * has to point somewhere: it points at the tombstone account.
 *
 * The report is NOT NULL too, but it cannot go to the tombstone —
 * `bcr_content_reporter_uq(content_type, content_id, reporter_user_id)` is the
 * dedupe rule, so the second erased account that ever reported the same post
 * would hit a duplicate key and the whole erasure would roll back. Deleting is
 * also the better answer on its own terms: a report is the REPORTER's act, so it
 * is their personal data, and the moderation outcome survives regardless in
 * `boffmedia_content_moderation` and `boffmedia_moderation_sanctions`.
 *
 * The sanction is nullable exactly so a ban can survive its subject, and
 * pointing it at the tombstone would make the shared tombstone account read as
 * banned in the admin UI, so it goes to NULL instead.
 *
 * Doing none of this is the failure this class exists to prevent: the DELETE
 * throws `ER_ROW_IS_REFERENCED_2` at 3am, inside a `try` that only logs, and the
 * retention promise silently stops being kept.
 */
@Injectable()
export class UserErasureRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * The shared tombstone account, created if it is missing.
   *
   * Resolve-or-create rather than "the migration inserted it": a dev database
   * restored from a dump predating migration 0007 would otherwise fail every
   * erasure with a foreign-key error nobody would connect to a missing seed row.
   */
  async ensureTombstoneUserId(): Promise<number> {
    const [existing] = await this.db
      .select({ id: boffMediaUsers.id })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.username, TOMBSTONE_USERNAME))
      .limit(1);

    if (existing) return existing.id;

    const [res] = await this.db.insert(boffMediaUsers).values({
      username: TOMBSTONE_USERNAME,
      email: TOMBSTONE_EMAIL,
      password: null,
      // Soft-deleted from birth: every read path filters on `deleted_at`, so
      // this never appears in a user list, a search or a login.
      deletedAt: new Date(),
      emailVerified: false,
    });
    return res.insertId;
  }

  /**
   * Accounts soft-deleted before `cutoff`, oldest first.
   *
   * `ne(id, tombstoneId)` is load-bearing: the tombstone carries a `deleted_at`
   * of its own, so without it the first sweep after this ships would select the
   * tombstone, fail to delete it (every reassigned post now restricts it), and
   * log a foreign-key error every night forever.
   */
  async findDueForErasure(
    cutoff: Date,
    tombstoneId: number,
    limit: number,
  ): Promise<{ id: number; deletedAt: Date | null }[]> {
    return this.db
      .select({ id: boffMediaUsers.id, deletedAt: boffMediaUsers.deletedAt })
      .from(boffMediaUsers)
      .where(
        and(
          isNotNull(boffMediaUsers.deletedAt),
          lt(boffMediaUsers.deletedAt, cutoff),
          ne(boffMediaUsers.id, tombstoneId),
        ),
      )
      .orderBy(boffMediaUsers.deletedAt)
      .limit(limit);
  }

  /** Files still registered to the account — counted, not deleted. See the service. */
  async countUploads(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(boffMediaUploads)
      .where(eq(boffMediaUploads.ownerUserId, userId));
    return row?.n ?? 0;
  }

  /**
   * Clear the four RESTRICT references — two reassigned, one deleted, one
   * nulled — and then delete the account, in one transaction, in that order.
   *
   * One transaction because the halfway state is the bad one: forum history
   * reassigned to the tombstone while the account survives means the person's
   * posts are now attributed to "deleted account" on an account that still
   * works. Either the whole erasure happens or none of it does.
   *
   * Returns what moved, for the audit row. Counts only — the point of the
   * operation is that the identifying data is gone.
   */
  async erase(
    userId: number,
    tombstoneId: number,
  ): Promise<{
    threads: number;
    posts: number;
    reportsDeleted: number;
    sanctions: number;
  }> {
    return this.db.transaction(async (tx) => {
      const [threads] = await tx
        .update(boffMediaForumThreads)
        .set({ userId: tombstoneId })
        .where(eq(boffMediaForumThreads.userId, userId));

      const [posts] = await tx
        .update(boffMediaForumPosts)
        .set({ userId: tombstoneId })
        .where(eq(boffMediaForumPosts.userId, userId));

      const [reports] = await tx
        .delete(boffMediaContentReports)
        .where(eq(boffMediaContentReports.reporterUserId, userId));

      const [sanctions] = await tx
        .update(boffMediaModerationSanctions)
        .set({ subjectUserId: null })
        .where(eq(boffMediaModerationSanctions.subjectUserId, userId));

      // Everything else is ON DELETE CASCADE or SET NULL, so this single
      // statement takes the tokens, notifications, uploads rows, grants, tool
      // data and the rest with it.
      await tx.delete(boffMediaUsers).where(eq(boffMediaUsers.id, userId));

      return {
        threads: threads.affectedRows,
        posts: posts.affectedRows,
        reportsDeleted: reports.affectedRows,
        sanctions: sanctions.affectedRows,
      };
    });
  }
}
