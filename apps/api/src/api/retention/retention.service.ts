import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { RetentionRepository } from './repositories/retention.repository';

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
 */
@Injectable()
export class RetentionService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: RetentionRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweep(): Promise<void> {
    const now = new Date();
    const summary: string[] = [];

    try {
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

      if (summary.length > 0) {
        (this.logger as any).info(`Retention sweep: ${summary.join(', ')}`);
      }
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      this.logger.error(`Retention sweep failed: ${error?.message}`);
    }
  }
}
