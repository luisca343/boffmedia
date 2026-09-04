import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { Counter } from 'prom-client';
import { env } from '@/config/env';
import { RetentionRepository } from './repositories/retention.repository';
import { UserErasureService } from './user-erasure.service';
import { DataExportService } from '@api/boffmedia/data-export/data-export.service';

/**
 * Daily housekeeping: purges data beyond its retention window.
 *
 * D11 — Nothing is ever purged (P2) without a configurable grace period.
 * Each sweep is configurable: setting its window to 0 disables it.
 *
 * Housekeeping only: read paths re-check expiry and data conditions as they
 * fetch, so nothing depends on this having run. The queries live in
 * `RetentionRepository`; a service never talks to Drizzle directly. Failure
 * must never crash the scheduler tick.
 *
 * One exception to "nothing depends on this having run": the erasure step below
 * hard-deletes accounts, which nothing else in the codebase will ever do. If
 * this tick stops firing, soft-deleted accounts accumulate silently — the exact
 * state A18 describes.
 *
 * A8 — Distributed lease (database row): the sweep claims a lease to prevent
 * concurrent runs on multi-instance deployments. The lease expires after 90 minutes
 * (if the process crashes), allowing the next instance to claim it. Release is
 * guaranteed on all paths via try/finally, and sweep failures surface in metrics
 * rather than being swallowed. Unlike MySQL advisory locks (which are per-connection
 * and break with connection pooling), leases are connection-independent.
 *
 * Previously assumed a SINGLE API instance (owner decision Q9, 2026-09-04).
 * The lease is cheap insurance even for single-instance deployments, and
 * batched deletes + visible failures are worth doing unconditionally.
 */

const sweepErrorsTotal = new Counter({
  name: 'retention_sweep_errors_total',
  help: 'Retention sweep failures by error type',
  labelNames: ['error_type'],
});

@Injectable()
export class RetentionService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: RetentionRepository,
    private readonly erasure: UserErasureService,
    private readonly dataExport: DataExportService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweep(): Promise<void> {
    const now = new Date();
    const summary: string[] = [];
    const lockName = 'boffmedia_retention_sweep';
    let leaseToken: string | null = null;

    try {
      // A8 — Claim a distributed lease (database row) so concurrent instances
      // cannot run the sweep simultaneously. Returns a lease token if successful,
      // null if another instance owns the lease. The lease expires after 90 minutes;
      // if the process crashes, the next instance can claim it.
      leaseToken = await this.repo.claimLease(lockName, 90);
      if (!leaseToken) {
        // Another instance owns the lease; silently return.
        // This is expected and not an error — the other instance has the work.
        return;
      }
      // Notifications: read only, older than window
      if (env.RETENTION_NOTIFICATIONS_DAYS > 0) {
        const cutoff = new Date(
          now.getTime() - env.RETENTION_NOTIFICATIONS_DAYS * 24 * 60 * 60 * 1000,
        );
        const deleted = await this.repo.deleteOldReadNotifications(cutoff);
        if (deleted > 0) summary.push(`notifications: -${deleted}`);
      }

      // Audit trails: age-based across multiple tables
      if (env.RETENTION_AUDIT_MONTHS > 0) {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - env.RETENTION_AUDIT_MONTHS);

        const boffmedia = await this.repo.deleteBoffMediaAuditOld(cutoff);
        if (boffmedia > 0) summary.push(`boffmedia_audit: -${boffmedia}`);

        const packs = await this.repo.deletePackAuditOld(cutoff);
        if (packs > 0) summary.push(`pack_audit: -${packs}`);

        const randomizer = await this.repo.deleteRandomizerAuditOld(cutoff);
        if (randomizer > 0) summary.push(`randomizer_audit: -${randomizer}`);
      }

      // Gobierno audits: separate window
      if (env.RETENTION_GOBIERNO_AUDIT_MONTHS > 0) {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - env.RETENTION_GOBIERNO_AUDIT_MONTHS);
        const deleted = await this.repo.deleteGobiernoAuditoriaOld(cutoff);
        if (deleted > 0) summary.push(`gobierno_auditoria: -${deleted}`);
      }

      // Outbox: delivered rows past the grace period. Failed rows are kept —
      // see the repository comment for why.
      if (env.RETENTION_OUTBOX_DAYS > 0) {
        const cutoff = new Date(
          now.getTime() - env.RETENTION_OUTBOX_DAYS * 24 * 60 * 60 * 1000,
        );
        const deleted = await this.repo.deleteDeliveredOutbox(cutoff);
        if (deleted > 0) summary.push(`outbox: -${deleted}`);
      }

      // Event invites: expired past grace period
      if (env.RETENTION_EVENT_INVITES_GRACE_DAYS > 0) {
        const cutoff = new Date(
          now.getTime() - env.RETENTION_EVENT_INVITES_GRACE_DAYS * 24 * 60 * 60 * 1000,
        );
        const deleted = await this.repo.deleteExpiredEventInvites(cutoff);
        if (deleted > 0) summary.push(`event_invites: -${deleted}`);
      }

      // Note versions: keep only most recent N per document
      if (env.RETENTION_NOTE_VERSIONS_KEEP > 0) {
        const deleted = await this.repo.deleteOldNoteVersions(
          env.RETENTION_NOTE_VERSIONS_KEEP,
        );
        if (deleted > 0) summary.push(`note_versions: -${deleted}`);
      }

      // GDPR export archives: a full copy of one person's data sitting on disk,
      // so the window is short and the file is unlinked before the row forgets
      // its name.
      const purgedExports = await this.dataExport.purgeExpired(now);
      if (purgedExports > 0) summary.push(`data_exports: -${purgedExports}`);

      // A18 — soft-deleted accounts were kept forever. Last in the sweep on
      // purpose: it is the only step that hard-deletes rows other steps still
      // reference, so it runs against a tree the rest of the pass has already
      // trimmed.
      const erased = await this.erasure.sweep(now);
      if (erased > 0) summary.push(`deleted_users: -${erased}`);

      if (summary.length > 0) {
        (this.logger as any).info(`Retention sweep: ${summary.join(', ')}`);
      }
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      // A8 — Categorize the error for metrics visibility.
      const errorType = this.categorizeError(error);
      sweepErrorsTotal.inc({ error_type: errorType });
      this.logger.error(`Retention sweep failed [${errorType}]: ${error?.message}`);
    } finally {
      // A8 — ALWAYS release the lease, even if the sweep threw. A leaked lease
      // (row stays in the table) is worse than no lease, because the next sweep
      // waits 90 minutes before retrying. The lease expires automatically via
      // expiry time, but we should release it immediately if we own it.
      // If release fails, log it but don't rethrow.
      if (leaseToken) {
        try {
          await this.repo.releaseLease(lockName, leaseToken);
        } catch (releaseError: any) {
          this.logger.error(
            `Retention sweep lease release failed: ${releaseError?.message}`,
          );
        }
      }
    }
  }

  /**
   * Categorize errors for metrics. This tells us whether sweep failures
   * are transient (database timeout) or systematic (missing table, schema change).
   */
  private categorizeError(error: any): string {
    const message = (error?.message ?? '').toLowerCase();
    const code = error?.code ?? '';

    // Connection failures: network-level issues
    if (
      message.includes('econnrefused') ||
      message.includes('connection lost') ||
      message.includes('connection reset') ||
      code === 'PROTOCOL_CONNECTION_LOST'
    ) {
      return 'connection_lost';
    }
    // Timeouts: query or lock acquisition took too long
    if (
      message.includes('timeout') ||
      message.includes('lock wait timeout') ||
      code === 'PROTOCOL_SEQUENCE_TIMEOUT'
    ) {
      return 'timeout';
    }
    // Schema mismatches: table or column doesn't exist
    if (
      message.includes('no such table') ||
      message.includes('bad field error') ||
      code === 'ER_NO_SUCH_TABLE' ||
      code === 'ER_BAD_FIELD_ERROR'
    ) {
      return 'schema_mismatch';
    }
    // Deadlocks: transaction conflict
    if (message.includes('deadlock') || code === 'ER_LOCK_DEADLOCK') {
      return 'deadlock';
    }
    return 'unknown';
  }
}
