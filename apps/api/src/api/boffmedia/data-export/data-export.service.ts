import { randomBytes } from 'node:crypto';
import type { ReadStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { env } from '@/config/env';
import { dataExportPath } from '@/config/paths';
import {
  EXPORT_STATUS,
  type DataExport,
} from '@/_db/schema/BoffMediaDataExports';

import {
  EXCLUDED_TABLES,
  EXPORTED_TABLES,
  type ExportSection,
} from './data-export.manifest';
import { DataExportRepository } from './repositories/data-export.repository';

/** Outbox topic the dispatcher routes back into {@link DataExportService.build}. */
export const DATA_EXPORT_TOPIC = 'gdpr:build-export';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Self-serve "give me everything you hold on me" (GDPR art. 15 / 20).
 *
 * Three steps, deliberately split:
 *
 * 1. {@link request} writes a row and enqueues an outbox job. It does NOT build
 *    anything: the build reads ~90 tables across two identities, which is a
 *    30-second request that a proxy cuts at 30 and a user retries at 5, and each
 *    retry would start another one.
 * 2. {@link build} runs on the outbox dispatcher a minute later, writes the
 *    archive to `dataExportPath()`, and flips the row to `ready`.
 * 3. {@link open} hands the bytes back, re-checking ownership and expiry.
 *
 * The rate limit that matters is the cooldown in {@link request}, not the HTTP
 * throttler: a throttler stops a burst, and the thing to stop here is one
 * expensive request an hour, forever.
 */
@Injectable()
export class DataExportService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: DataExportRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  // ── 1. Request ───────────────────────────────────────────────────────────

  /**
   * Record the request and queue the build. Returns the row the browser polls.
   *
   * Idempotent while one is pending: asking twice hands back the same row rather
   * than queueing a second build, so a double-clicked button costs nothing.
   */
  async request(userId: number): Promise<DataExport> {
    const latest = await this.repo.findLatestForUser(userId);

    if (latest?.status === EXPORT_STATUS.PENDING) return latest;

    const cooldownMs = env.DATA_EXPORT_COOLDOWN_HOURS * HOUR_MS;
    if (cooldownMs > 0 && latest && latest.status !== EXPORT_STATUS.FAILED) {
      // A failed attempt does not burn the cooldown — the user got nothing.
      const elapsed = Date.now() - latest.requestedAt.getTime();
      if (elapsed < cooldownMs) {
        const hours = Math.ceil((cooldownMs - elapsed) / HOUR_MS);
        throw new BadRequestException(
          userError(
            ApiErrorCode.DATA_EXPORT_TOO_SOON,
            `data export requested again after ${Math.floor(elapsed / HOUR_MS)}h`,
            `Ya has pedido tus datos hace poco. Podrás volver a pedirlos en ${hours} h.`,
          ),
        );
      }
    }

    const id = await this.repo.create(userId);
    await this.outbox.enqueue(DATA_EXPORT_TOPIC, { exportId: id, userId });

    const created = await this.repo.findById(id);
    if (!created) {
      // The insert just returned this id, so this is unreachable; it exists so
      // the caller never gets a null it would have to model.
      throw new Error(`data export ${id} vanished immediately after insert`);
    }
    return created;
  }

  /** The row the profile page polls. */
  async status(userId: number): Promise<DataExport | null> {
    return this.repo.findLatestForUser(userId);
  }

  // ── 2. Build (outbox handler) ────────────────────────────────────────────

  /**
   * Assemble the archive and write it to disk. Called by the outbox dispatcher.
   *
   * Throws on failure AFTER stamping the row, so the user sees `failed` straight
   * away while the outbox still retries with backoff — a transient DB blip then
   * fixes itself, and the row flips back to `ready` on the retry that works.
   */
  async build(exportId: number, userId: number): Promise<void> {
    const row = await this.repo.findById(exportId);
    if (!row) {
      // Already erased with the account, most likely. Nothing to do, and
      // throwing would make the outbox retry it five times.
      this.logger.warn(`Data export ${exportId} no longer exists; skipping`);
      return;
    }
    if (row.status !== EXPORT_STATUS.PENDING) return;

    try {
      const document = await this.assemble(userId);
      const filename = `boffmedia-export-${userId}-${exportId}-${randomBytes(8).toString('hex')}.json`;

      await mkdir(dataExportPath(), { recursive: true });
      const body = JSON.stringify(document, null, 2);
      await writeFile(dataExportPath(filename), body, 'utf8');

      const { size } = await stat(dataExportPath(filename));
      await this.repo.markReady(
        exportId,
        filename,
        size,
        new Date(Date.now() + env.DATA_EXPORT_TTL_DAYS * DAY_MS),
      );

      // Counts, never content: this line ends up in the application log.
      this.logger.log(
        `Data export ${exportId} built for user ${userId}: ${document.summary.tablesWithData} table(s), ${document.summary.totalRows} row(s), ${size} bytes`,
      );
    } catch (error: any) {
      await this.repo.markFailed(exportId, String(error?.message ?? error));
      throw error;
    }
  }

  /**
   * Read every exported table and shape the result into something a person can
   * actually read: sections, a sentence per table saying what the rows mean, and
   * the list of what was deliberately left out.
   *
   * Sequential on purpose. This is a background job with no deadline, and the
   * alternative — ~90 concurrent selects — is a connection-pool spike that would
   * be felt by everyone using the site while one person downloads their data.
   */
  private async assemble(userId: number) {
    const subject = await this.repo.resolveSubject(userId);
    if (!subject) {
      throw new Error(`user ${userId} not found or already deleted`);
    }

    const sections: Record<
      string,
      Record<string, { meaning: string; rowCount: number; rows: unknown[] }>
    > = {};

    let totalRows = 0;
    let tablesWithData = 0;

    for (const spec of EXPORTED_TABLES) {
      const rows = await this.repo.collect(spec, subject);
      if (rows.length === 0) continue;

      const section = (sections[spec.section] ??= {});
      section[spec.table] = {
        meaning: spec.meaning,
        rowCount: rows.length,
        rows,
      };

      totalRows += rows.length;
      tablesWithData += 1;
    }

    return {
      about:
        'This file is everything Boffmedia holds about one account, in the form it is stored in. Each table below carries a plain-language note saying what its rows mean.',
      otherPeoplesData:
        'Data that belongs to somebody else is deliberately absent, even where it sits next to yours: a thread you started is here, the replies under it are not; a message you sent is here, the answer to it is not. Where a row is genuinely about you but names a second person — the moderator who applied a sanction, the seller on an order line, the opponent in a battle — that row is included with the other person removed.',
      generatedAt: new Date().toISOString(),
      subject: {
        accountId: subject.accountId,
        minecraftUuid: subject.mcUuid,
      },
      summary: {
        tablesConsidered: EXPORTED_TABLES.length + EXCLUDED_TABLES.length,
        tablesExportable: EXPORTED_TABLES.length,
        tablesWithData,
        totalRows,
      },
      sections: sections as Record<ExportSection, unknown>,
      // Shipped WITH the data, not instead of it: "we hold nothing else" is a
      // claim, and this is the working out behind it.
      notIncluded: EXCLUDED_TABLES.map((t) => ({
        table: t.table,
        reason: t.reason,
      })),
    };
  }

  // ── 3. Download ──────────────────────────────────────────────────────────

  /**
   * Open the archive for streaming, after checking it is this user's, is ready,
   * and has not expired.
   */
  async open(
    userId: number,
    exportId: number,
  ): Promise<{ stream: ReadStream; filename: string; size: number }> {
    const row = await this.repo.findById(exportId);
    if (!row) throw new NotFoundException('Export not found');

    // Not `OwnerOrAdminGuard`: this file is the densest pile of one person's
    // data the system can produce, and an admin already has the database. Owner
    // only, no exceptions.
    if (row.userId !== userId) throw new ForbiddenException('Not your export');

    if (row.status !== EXPORT_STATUS.READY || !row.filename) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.DATA_EXPORT_NOT_READY,
          `export ${exportId} is ${row.status}`,
        ),
      );
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.DATA_EXPORT_EXPIRED,
          `export ${exportId} expired at ${row.expiresAt.toISOString()}`,
        ),
      );
    }

    // `basename` even though the column is written by us and never by a user:
    // it costs nothing and it is the difference between a bad row and a path
    // traversal out of the export directory.
    const path = dataExportPath(basename(row.filename));

    return {
      stream: createReadStream(path),
      filename: basename(row.filename),
      size: row.sizeBytes ?? 0,
    };
  }

  // ── Housekeeping (called by the daily retention sweep) ───────────────────

  /**
   * Delete archives past their window and blank the row's filename.
   *
   * Order matters: unlink first, THEN forget the name. The other way round
   * leaves the file on disk with nothing pointing at it, which is how a store
   * of everyone's personal data accumulates quietly forever.
   */
  async purgeExpired(now: Date): Promise<number> {
    const expired = await this.repo.findExpired(now);
    let purged = 0;

    for (const row of expired) {
      if (row.filename) await this.removeFile(row.filename);
      await this.repo.markExpired(row.id);
      purged += 1;
    }

    return purged;
  }

  /** Every archive belonging to one account — used before a hard delete. */
  async purgeForUser(userId: number): Promise<number> {
    const filenames = await this.repo.filenamesForUser(userId);
    for (const filename of filenames) await this.removeFile(filename);
    return filenames.length;
  }

  private async removeFile(filename: string): Promise<void> {
    try {
      await unlink(dataExportPath(basename(filename)));
    } catch (error: any) {
      // ENOENT is the normal case on a second pass or after a manual clean-up.
      // Anything else is worth a line, but never worth failing the sweep.
      if (error?.code !== 'ENOENT') {
        this.logger.warn(
          `Could not delete export archive ${filename}: ${error?.message}`,
        );
      }
    }
  }
}
