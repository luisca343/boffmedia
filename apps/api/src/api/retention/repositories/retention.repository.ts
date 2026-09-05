import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaNotifications } from '@/_db/schema/BoffMediaNotifications';
import {
  boffMediaAudit,
  boffMediaEventInvites,
} from '@/_db/schema/BoffMediaEvents';
import { packAudit } from '@/_db/schema/Packs';
import { randomizerAudit } from '@/_db/schema/Randomizer';
import { gobiernoAuditoria } from '@/_db/schema/SmartRotomGobierno';
import { rotomNoteVersions } from '@/_db/schema/SmartRotomDocuments';
import { boffMediaOutbox } from '@/_db/schema/BoffMediaOutbox';
import { retentionLease } from '@/_db/schema/Retention';

/**
 * The delete side of the daily retention sweep (see `RetentionService`).
 *
 * Each method is independent so a failure on one table does not stop the others.
 * All deletes are bounded by LIMIT and loop until fewer than LIMIT rows match,
 * so a first run against a large table does not lock it for minutes or blow the
 * binlog.
 *
 * Nothing depends on this having run: the service layers that read these tables
 * typically filter by timestamp or check status, so an old row is harmless and
 * a missing row that should have been deleted is tolerable.
 */
@Injectable()
export class RetentionRepository {
  private readonly BATCH_SIZE = 5000;

  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * A8 — Claim a distributed lease for the retention sweep via a database row.
   * Returns a lease token if successful, null if another instance owns the lease.
   *
   * The lease row is claimed with a conditional UPDATE that succeeds only if:
   *   - No row exists (first claim ever)
   *   - The existing row's expiry is in the past (previous owner crashed or abandoned it)
   *
   * If another instance owns a live lease, the UPDATE affects 0 rows and we return null.
   *
   * The lease lasts 90 minutes; if the process crashes, the row stays in the
   * table but expires, allowing the next instance to claim it after a delay.
   * The service should call releaseLease() to release it immediately when done.
   */
  async claimLease(
    lockName: string,
    durationMinutes: number = 90,
  ): Promise<string | null> {
    const ownerId = randomUUID();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Attempt to INSERT or UPDATE: use INSERT ... ON DUPLICATE KEY UPDATE
    // to either create the row (if it doesn't exist) or claim it (if expired).
    await this.db.execute<any>(
      sql`
        INSERT INTO ${retentionLease}
        (lock_name, owner_id, expires_at)
        VALUES (${lockName}, ${ownerId}, ${expiresAt})
        ON DUPLICATE KEY UPDATE
          owner_id = CASE
            WHEN expires_at < NOW() THEN ${ownerId}
            ELSE owner_id
          END,
          expires_at = CASE
            WHEN expires_at < NOW() THEN ${expiresAt}
            ELSE expires_at
          END;
      `,
    );

    // After the INSERT/UPDATE, query to check if we own the lease.
    // If expires_at is in the future and owner_id is ours, we own it.
    const [lease] = await this.db
      .select()
      .from(retentionLease)
      .where(
        and(
          eq(retentionLease.lockName, lockName),
          eq(retentionLease.ownerId, ownerId),
          sql`${retentionLease.expiresAt} > NOW()`,
        ),
      );

    return lease ? ownerId : null;
  }

  /**
   * A8 — Release a distributed lease by deleting the row.
   * This should only be called by the instance that owns the lease (has the token).
   *
   * If the lease was already released or claimed by another instance,
   * the DELETE affects 0 rows but does not error. The service should handle
   * this gracefully (it is not an error to release when already released).
   */
  async releaseLease(lockName: string, ownerId: string): Promise<void> {
    await this.db
      .delete(retentionLease)
      .where(
        and(
          eq(retentionLease.lockName, lockName),
          eq(retentionLease.ownerId, ownerId),
        ),
      );
  }

  /**
   * Delete read notifications older than the retention window.
   * Unread notifications are never deleted.
   */
  async deleteOldReadNotifications(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    // Loop until we delete fewer than BATCH_SIZE in a single pass, meaning we've
    // cleared all rows matching the condition. This prevents a single DELETE from
    // locking the table for minutes on a large collection.
    while (true) {
      const [result] = await this.db
        .delete(boffMediaNotifications)
        .where(
          and(
            // Only delete if readAt is not null (i.e., was read).
            // Unread notifications (readAt IS NULL) are preserved.
            isNotNull(boffMediaNotifications.readAt),
            lt(boffMediaNotifications.createdAt, cutoffDate),
          ),
        )
        .limit(this.BATCH_SIZE);

      const deleted = result.affectedRows;
      totalDeleted += deleted;

      if (deleted < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete audit logs older than the retention window. These tables record
   * admin actions, config changes, and access audits — they serve compliance
   * but become useless past the retention period. boffmedia_audit covers both
   * events and tournaments in one log.
   */
  async deleteBoffMediaAuditOld(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(boffMediaAudit)
        .where(lt(boffMediaAudit.at, cutoffDate))
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete outbox rows that were successfully delivered before the cutoff.
   *
   * Deliberately scoped to `delivered`: a `failed` row is the only record that
   * a side effect never happened, so purging those by age would erase exactly
   * the evidence someone needs. They stay until a human resolves them.
   */
  async deleteDeliveredOutbox(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(boffMediaOutbox)
        .where(
          and(
            eq(boffMediaOutbox.status, 'delivered'),
            lt(boffMediaOutbox.deliveredAt, cutoffDate),
          ),
        )
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete pack audit logs (downloads, grants, revocations) older than the
   * retention window.
   */
  async deletePackAuditOld(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(packAudit)
        .where(lt(packAudit.at, cutoffDate))
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete randomizer audit logs (ROM processing, assignments, verification)
   * older than the retention window.
   */
  async deleteRandomizerAuditOld(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(randomizerAudit)
        .where(lt(randomizerAudit.createdAt, cutoffDate))
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete gobierno audit logs (admin actions across the SmartRotom admin
   * module) older than the retention window.
   */
  async deleteGobiernoAuditoriaOld(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(gobiernoAuditoria)
        .where(lt(gobiernoAuditoria.createdAt, cutoffDate))
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete event invitations that expired past the grace period. The grace
   * period lets admins resend a link that "just expired" without race
   * conditions: the code is still valid while the user's browser is loading
   * the redemption form. Only invites with a set expiry are purged; those
   * without an expiry date are kept indefinitely.
   */
  async deleteExpiredEventInvites(cutoffDate: Date): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const [result] = await this.db
        .delete(boffMediaEventInvites)
        .where(
          and(
            // Only delete invites with an explicit expiry
            isNotNull(boffMediaEventInvites.expiresAt),
            // AND whose expiry is past the grace period cutoff
            lt(boffMediaEventInvites.expiresAt, cutoffDate),
          ),
        )
        .limit(this.BATCH_SIZE);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }

  /**
   * Delete old note versions, keeping only the most recent N per document.
   * Version history enables "undo" but the entire list is not useful past a
   * certain depth; this trims the long tail.
   *
   * For each document, versions are identified by their ordinal position
   * (newest-first). We delete all versions beyond position N using a window
   * function. The delete is bounded by BATCH_SIZE and loops until fewer than
   * BATCH_SIZE rows match, so concurrent inserts/deletes do not break the
   * invariant: each document retains its N most recent versions.
   *
   * This is safe under concurrent writes: a concurrent delete of an old version
   * reduces future work, and a concurrent insert increments a document's version
   * count. The row-number ranking is recalculated on each iteration, so the
   * invariant holds even under concurrent load.
   */
  async deleteOldNoteVersions(keepCount: number): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      // Find the IDs of all versions beyond the keep count for each document.
      // We rank versions newest-first, then select those with rank > keepCount,
      // limited to BATCH_SIZE to avoid locking the table.
      const toDelete = await this.db
        .select({
          id: rotomNoteVersions.id,
        })
        .from(
          sql`(
            select
              id,
              row_number() over (partition by document_id order by created_at desc) as rn
            from rotom_note_versions
          ) ranked`,
        )
        .where(sql`ranked.rn > ${keepCount}`)
        .limit(this.BATCH_SIZE);

      if (toDelete.length === 0) break; // No old versions remain

      const idsToDelete = toDelete.map((r) => r.id);

      const [result] = await this.db
        .delete(rotomNoteVersions)
        .where(sql`id in (${sql.join(idsToDelete, sql`,`)})`);

      totalDeleted += result.affectedRows;
      if (result.affectedRows < this.BATCH_SIZE) break;
    }

    return totalDeleted;
  }
}
