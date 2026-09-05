import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, lt, or, type SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';

import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { boffMediaParticipants } from '@/_db/schema/BoffMediaEvents';
import {
  boffMediaDataExports,
  EXPORT_STATUS,
  type DataExport,
} from '@/_db/schema/BoffMediaDataExports';
import { sharexTokens } from '@/_db/schema/Sharex';
import { rotomChatMembers } from '@/_db/schema/SmartRotomChat';
import { rotomUserDocuments } from '@/_db/schema/SmartRotomDocuments';
import { mineGames } from '@/_db/schema/SmartRotomMine';
import { starBankUserAccounts } from '@/_db/schema/SmartRotomStarBank';
import {
  wigglypopListings,
  wigglypopOrders,
} from '@/_db/schema/SmartRotomWigglypop';

import type { ExportedTable, ExportSubject } from '../data-export.manifest';

/**
 * Reads for the GDPR data export (see `data-export.manifest.ts`).
 *
 * {@link collect} is deliberately generic: it takes a manifest entry and turns
 * it into one `SELECT`, so adding a table to the export is a manifest edit and
 * nothing else. A per-table method here would put the ownership rule in two
 * places, and the second copy is the one that drifts.
 */
@Injectable()
export class DataExportRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ── The subject ──────────────────────────────────────────────────────────

  /**
   * Everything the manifest keys on, resolved once per export.
   *
   * Returns null for an unknown or already soft-deleted account: a tombstone has
   * had its email, uuid and provider ids scrubbed, so an export built from one
   * would be an archive of nothing wearing the shape of an answer.
   */
  async resolveSubject(userId: number): Promise<ExportSubject | null> {
    const [user] = await this.db
      .select({
        id: boffMediaUsers.id,
        email: boffMediaUsers.email,
        uuid: boffMediaUsers.uuid,
        discordId: boffMediaUsers.discordId,
      })
      .from(boffMediaUsers)
      .where(
        and(eq(boffMediaUsers.id, userId), isNull(boffMediaUsers.deletedAt)),
      )
      .limit(1);

    if (!user) return null;

    const mcUuid = user.uuid;

    const [
      participants,
      sharex,
      documents,
      bankAccounts,
      orders,
      listings,
      mine,
      chats,
    ] = await Promise.all([
      this.db
        .select({ id: boffMediaParticipants.id })
        .from(boffMediaParticipants)
        .where(eq(boffMediaParticipants.userId, userId)),
      this.db
        .select({ id: sharexTokens.id })
        .from(sharexTokens)
        .where(eq(sharexTokens.createdBy, userId)),
      // The uuid-keyed sets stay empty when there is no linked Minecraft
      // identity, which makes every SmartRotom clause drop out rather than
      // matching on NULL.
      mcUuid
        ? this.db
            .select({ id: rotomUserDocuments.documentId })
            .from(rotomUserDocuments)
            .where(eq(rotomUserDocuments.uuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
      mcUuid
        ? this.db
            .select({ id: starBankUserAccounts.accountId })
            .from(starBankUserAccounts)
            .where(eq(starBankUserAccounts.uuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
      mcUuid
        ? this.db
            .select({ id: wigglypopOrders.id })
            .from(wigglypopOrders)
            .where(eq(wigglypopOrders.buyerUuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
      mcUuid
        ? this.db
            .select({ id: wigglypopListings.id })
            .from(wigglypopListings)
            .where(eq(wigglypopListings.sellerUuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
      mcUuid
        ? this.db
            .select({ id: mineGames.id })
            .from(mineGames)
            .where(eq(mineGames.uuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
      mcUuid
        ? this.db
            .select({ id: rotomChatMembers.chatId })
            .from(rotomChatMembers)
            .where(eq(rotomChatMembers.uuid, mcUuid))
        : Promise.resolve([] as { id: number }[]),
    ]);

    const ids = (rows: { id: number }[]) => rows.map((r) => r.id);

    return {
      accountId: user.id,
      mcUuid,
      discordId: user.discordId,
      email: user.email,
      participantIds: ids(participants),
      sharexTokenIds: ids(sharex),
      documentIds: ids(documents),
      bankAccountIds: ids(bankAccounts),
      orderIds: ids(orders),
      listingIds: ids(listings),
      mineGameIds: ids(mine),
      chatIds: ids(chats),
    };
  }

  // ── The rows ─────────────────────────────────────────────────────────────

  /**
   * Every row of one table that belongs to the subject, with the manifest's
   * `redact` columns removed.
   *
   * An `ownedBy` clause whose key resolves to null (no linked Minecraft account)
   * or to an empty set is DROPPED rather than compared. That distinction is the
   * whole safety of this method: `WHERE uuid = NULL` matches nothing, but
   * `inArray(col, [])` renders as a bare `false`-ish fragment in some builders
   * and an unfiltered scan in others, and an unfiltered scan here means every
   * other user's rows in someone's archive. With every clause dropped there is
   * no `WHERE` left to be wrong about, so the method returns nothing at all.
   */
  async collect(
    spec: ExportedTable,
    subject: ExportSubject,
  ): Promise<Record<string, unknown>[]> {
    const clauses: SQL[] = [];

    for (const { column, key } of spec.ownedBy) {
      const value = subject[key];
      if (Array.isArray(value)) {
        if (value.length > 0) clauses.push(inArray(column, value));
      } else if (value !== null && value !== undefined) {
        clauses.push(eq(column, value));
      }
    }

    if (clauses.length === 0) return [];

    const where = clauses.length === 1 ? clauses[0] : or(...clauses);

    const rows = (await this.db
      .select()
      .from(spec.drizzle)
      .where(where)) as unknown as Record<string, unknown>[];

    if (!spec.redact?.length) return rows;

    for (const row of rows) {
      for (const prop of spec.redact) delete row[prop];
    }

    return rows;
  }

  // ── The request row ──────────────────────────────────────────────────────

  /** The user's most recent request, whatever state it is in. */
  async findLatestForUser(userId: number): Promise<DataExport | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaDataExports)
      .where(eq(boffMediaDataExports.userId, userId))
      .orderBy(desc(boffMediaDataExports.requestedAt))
      .limit(1);
    return row ?? null;
  }

  async findById(id: number): Promise<DataExport | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaDataExports)
      .where(eq(boffMediaDataExports.id, id))
      .limit(1);
    return row ?? null;
  }

  async create(userId: number): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaDataExports)
      .values({ userId, status: EXPORT_STATUS.PENDING });
    return res.insertId;
  }

  async markReady(
    id: number,
    filename: string,
    sizeBytes: number,
    expiresAt: Date,
  ): Promise<void> {
    await this.db
      .update(boffMediaDataExports)
      .set({
        status: EXPORT_STATUS.READY,
        filename,
        sizeBytes,
        expiresAt,
        completedAt: new Date(),
        lastError: null,
      })
      .where(eq(boffMediaDataExports.id, id));
  }

  async markFailed(id: number, error: string): Promise<void> {
    await this.db
      .update(boffMediaDataExports)
      .set({
        status: EXPORT_STATUS.FAILED,
        // Truncated: the column is TEXT, but a stack trace in a row the user can
        // poll is neither useful to them nor something to widen.
        lastError: error.slice(0, 500),
        completedAt: new Date(),
      })
      .where(eq(boffMediaDataExports.id, id));
  }

  /**
   * Ready exports whose window has closed. Returned rather than updated in bulk
   * so the caller can unlink each file before forgetting its name — a row
   * flipped to `expired` first would leave the archive on disk with nothing
   * pointing at it.
   */
  async findExpired(now: Date): Promise<DataExport[]> {
    return this.db
      .select()
      .from(boffMediaDataExports)
      .where(
        and(
          eq(boffMediaDataExports.status, EXPORT_STATUS.READY),
          lt(boffMediaDataExports.expiresAt, now),
        ),
      );
  }

  /** Every export file belonging to one account, ready or not. */
  async filenamesForUser(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({ filename: boffMediaDataExports.filename })
      .from(boffMediaDataExports)
      .where(eq(boffMediaDataExports.userId, userId));
    return rows
      .map((r) => r.filename)
      .filter((f): f is string => typeof f === 'string' && f.length > 0);
  }

  async markExpired(id: number): Promise<void> {
    await this.db
      .update(boffMediaDataExports)
      .set({ status: EXPORT_STATUS.EXPIRED, filename: null, sizeBytes: null })
      .where(eq(boffMediaDataExports.id, id));
  }
}
