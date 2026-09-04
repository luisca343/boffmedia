import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { AuditService } from '@api/_repositories/audit.service';
import { DataExportService } from '@api/boffmedia/data-export/data-export.service';
import { AUDIT_SUBJECT } from '@/_db/schema/BoffMediaEvents';
import { env } from '@/config/env';

import { UserErasureRepository } from './repositories/user-erasure.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How many accounts one nightly pass erases.
 *
 * Each one is a transaction that touches four tables and then fans out through
 * ~40 cascades, so this is not the kind of work to do ten thousand of in a
 * single tick. The backlog drains at 200 a night and nothing is lost by waiting:
 * every one of these rows is already scrubbed of its personal data.
 */
const ERASURE_BATCH = 200;

/**
 * Hard-deletes accounts whose soft-delete grace period has expired (A18, GDPR
 * art. 17).
 *
 * `BoffMediaUsersRepository.deleteUser` scrubs the row in place — email,
 * password, uuid, provider ids, avatar, bio — and stamps `deleted_at`. That
 * satisfies erasure of the identifying fields immediately; what it does not do
 * is ever remove the row, so a tombstone and every pseudonymous row still
 * hanging off it lived forever. This closes that.
 *
 * The window is {@link env.RETENTION_DELETED_USER_DAYS}, 30 days by default:
 * long enough for "I did not mean that" or a coerced deletion to be undone,
 * short enough to be "without undue delay". Set it to 0 to disable erasure.
 *
 * ## Single instance
 *
 * The API runs as ONE process (owner decision Q9, 2026-09-04), so there is no
 * distributed lock here and none is wanted. If that ever changes, this job is
 * the first thing to revisit: two schedulers would both select the same due
 * accounts, and the second one's transaction would fail on rows the first has
 * already deleted — noisy rather than dangerous, but wrong.
 */
@Injectable()
export class UserErasureService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: UserErasureRepository,
    private readonly audit: AuditService,
    private readonly dataExport: DataExportService,
  ) {}

  /**
   * One pass. Returns the number of accounts erased, for the sweep summary.
   *
   * Per-account try/catch: one account whose erasure fails — a RESTRICT nobody
   * anticipated, a lock timeout — must not stop the other 199. The failure is
   * logged with the id and retried on the next pass, because the row keeps its
   * `deleted_at` and stays due.
   */
  async sweep(now: Date): Promise<number> {
    if (env.RETENTION_DELETED_USER_DAYS <= 0) return 0;

    const cutoff = new Date(
      now.getTime() - env.RETENTION_DELETED_USER_DAYS * DAY_MS,
    );

    const tombstoneId = await this.repo.ensureTombstoneUserId();
    const due = await this.repo.findDueForErasure(
      cutoff,
      tombstoneId,
      ERASURE_BATCH,
    );
    if (due.length === 0) return 0;

    let erased = 0;

    for (const account of due) {
      try {
        // Before the row goes: the archives are files on disk, and
        // `boffmedia_data_exports` cascades, so deleting the user first would
        // take away the only record of which files to remove.
        const archives = await this.dataExport.purgeForUser(account.id);
        const uploads = await this.repo.countUploads(account.id);
        const moved = await this.repo.erase(account.id, tombstoneId);

        // Counts, never content. The account id is recorded because by the time
        // this row is written it resolves to nobody — which is the point — and
        // without it the trail cannot answer "was this account erased?".
        await this.audit.record({
          domain: 'boffmedia',
          subjectType: AUDIT_SUBJECT.USER,
          subjectId: account.id,
          action: 'user.erased',
          // null actor: the scheduler did this, not a person.
          actor: null,
          metadata: {
            softDeletedAt: account.deletedAt?.toISOString() ?? null,
            retentionDays: env.RETENTION_DELETED_USER_DAYS,
            forumThreadsReassigned: moved.threads,
            forumPostsReassigned: moved.posts,
            contentReportsDeleted: moved.reportsDeleted,
            sanctionsDetached: moved.sanctions,
            dataExportArchivesDeleted: archives,
            // Counted, not deleted: an uploaded image may be embedded in a
            // forum post that survives the erasure by design, so unlinking the
            // files here would put holes in other people's threads. Recorded so
            // the number is visible rather than merely unmentioned.
            uploadFilesLeftOnDisk: uploads,
          },
        });

        erased += 1;
      } catch (error: any) {
        // Stays due: `deleted_at` is untouched, so the next pass retries it.
        this.logger.error(
          `Erasure of soft-deleted account ${account.id} failed: ${error?.message}`,
        );
      }
    }

    return erased;
  }
}
