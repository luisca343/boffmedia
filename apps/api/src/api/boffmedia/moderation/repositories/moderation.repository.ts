import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  and,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import { AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaContentModeration,
  boffMediaContentReports,
  boffMediaModerationSanctions,
  ContentReport,
  ModerationSanction,
  REPORT_STATUS,
  ReportReason,
  ReportStatus,
  SANCTION_KIND,
  SanctionKind,
} from '@/_db/schema/BoffMediaModeration';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { ContentSurface } from '../content-registry';

/** One line of the admin queue: a piece of content plus its report tally. */
export interface QueueGroupRow {
  contentType: string;
  contentId: string;
  reportCount: number;
  firstReportedAt: Date;
  lastReportedAt: Date;
  authorUserId: number | null;
  authorUuid: string | null;
  reasons: string | null;
}

export type QueueSort = 'reports' | 'oldest' | 'newest';

export interface AuthorTally {
  key: string;
  openReports: number;
  actionedReports: number;
  totalReports: number;
}

@Injectable()
export class ModerationRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ─── reports ──────────────────────────────────────────────────────────────

  /**
   * Files a report, or updates the one this reporter already filed.
   *
   * `ON DUPLICATE KEY UPDATE` against `bcr_content_reporter_uq` rather than a
   * read-then-write: two rapid clicks from the same person are the ordinary
   * case, and a check-then-insert loses that race and returns a 500 where the
   * honest answer is "we already have your report".
   *
   * A re-report on an ALREADY RESOLVED item deliberately reopens it — the
   * content is still up and someone still objects, so it belongs back in the
   * queue rather than silently swallowed.
   */
  async upsertReport(input: {
    contentType: string;
    contentId: string;
    reporterUserId: number;
    reason: ReportReason;
    detail: string | null;
    authorUserId: number | null;
    authorUuid: string | null;
  }): Promise<void> {
    await this.db
      .insert(boffMediaContentReports)
      .values({
        contentType: input.contentType,
        contentId: input.contentId,
        reporterUserId: input.reporterUserId,
        reason: input.reason,
        detail: input.detail,
        authorUserId: input.authorUserId,
        authorUuid: input.authorUuid,
        status: REPORT_STATUS.OPEN,
      })
      .onDuplicateKeyUpdate({
        set: {
          reason: input.reason,
          detail: input.detail,
          status: REPORT_STATUS.OPEN,
          resolution: null,
          resolvedAt: null,
          resolvedByUserId: null,
        },
      });
  }

  /** The reporter's existing report on this item, if any. */
  async findReportByReporter(
    contentType: string,
    contentId: string,
    reporterUserId: number,
  ): Promise<ContentReport | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaContentReports)
      .where(
        and(
          eq(boffMediaContentReports.contentType, contentType),
          eq(boffMediaContentReports.contentId, contentId),
          eq(boffMediaContentReports.reporterUserId, reporterUserId),
        ),
      )
      .limit(1);
    return row;
  }

  /**
   * The queue itself: one row per reported item, not per report.
   *
   * Grouping in SQL rather than in the service is what makes "worst first"
   * possible at all — sorting by report count needs the count before the page
   * is cut, so a per-report listing could only ever offer "oldest first".
   */
  async listQueue(opts: {
    status: ReportStatus;
    contentType?: string;
    sort: QueueSort;
    limit: number;
    offset: number;
  }): Promise<{ rows: QueueGroupRow[]; total: number }> {
    const where = opts.contentType
      ? and(
          eq(boffMediaContentReports.status, opts.status),
          eq(boffMediaContentReports.contentType, opts.contentType),
        )
      : eq(boffMediaContentReports.status, opts.status);

    const reportCount = sql<number>`COUNT(*)`;
    const firstReportedAt = sql<Date>`MIN(${boffMediaContentReports.createdAt})`;
    const lastReportedAt = sql<Date>`MAX(${boffMediaContentReports.createdAt})`;

    const order: SQL[] =
      opts.sort === 'reports'
        ? [desc(reportCount), desc(lastReportedAt)]
        : opts.sort === 'oldest'
          ? [sql`MIN(${boffMediaContentReports.createdAt}) ASC`]
          : [desc(lastReportedAt)];

    const rows = await this.db
      .select({
        contentType: boffMediaContentReports.contentType,
        contentId: boffMediaContentReports.contentId,
        reportCount,
        firstReportedAt,
        lastReportedAt,
        // MAX over a column that is constant within the group: every report on
        // one item snapshots the same author. MIN/MAX is how you carry a
        // constant through a GROUP BY without relying on ONLY_FULL_GROUP_BY
        // being off.
        authorUserId: sql<
          number | null
        >`MAX(${boffMediaContentReports.authorUserId})`,
        authorUuid: sql<
          string | null
        >`MAX(${boffMediaContentReports.authorUuid})`,
        reasons: sql<
          string | null
        >`GROUP_CONCAT(DISTINCT ${boffMediaContentReports.reason})`,
      })
      .from(boffMediaContentReports)
      .where(where)
      .groupBy(
        boffMediaContentReports.contentType,
        boffMediaContentReports.contentId,
      )
      .orderBy(...order)
      .limit(opts.limit)
      .offset(opts.offset);

    // COUNT(DISTINCT a, b) counts distinct pairs — the number of GROUPS, which
    // is what the page count has to be. Counting rows here would page the
    // reports and label it items.
    const [totals] = await this.db
      .select({
        total: sql<number>`COUNT(DISTINCT ${boffMediaContentReports.contentType}, ${boffMediaContentReports.contentId})`,
      })
      .from(boffMediaContentReports)
      .where(where);

    return { rows: rows as QueueGroupRow[], total: Number(totals?.total ?? 0) };
  }

  /** Every report filed against one item, newest first, with reporter names. */
  async listReportsForContent(
    contentType: string,
    contentId: string,
  ): Promise<Array<ContentReport & { reporterUsername: string | null }>> {
    const rows = await this.db
      .select({
        report: boffMediaContentReports,
        reporterUsername: boffMediaUsers.username,
      })
      .from(boffMediaContentReports)
      .leftJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaContentReports.reporterUserId),
      )
      .where(
        and(
          eq(boffMediaContentReports.contentType, contentType),
          eq(boffMediaContentReports.contentId, contentId),
        ),
      )
      .orderBy(desc(boffMediaContentReports.createdAt));

    return rows.map((r) => ({
      ...r.report,
      reporterUsername: r.reporterUsername,
    }));
  }

  /** Everyone who reported this item and is still waiting to hear back. */
  async listOpenReporterIds(
    contentType: string,
    contentId: string,
  ): Promise<number[]> {
    const rows = await this.db
      .select({ id: boffMediaContentReports.reporterUserId })
      .from(boffMediaContentReports)
      .where(
        and(
          eq(boffMediaContentReports.contentType, contentType),
          eq(boffMediaContentReports.contentId, contentId),
          eq(boffMediaContentReports.status, REPORT_STATUS.OPEN),
        ),
      );
    return rows.map((r) => r.id);
  }

  /**
   * Closes every open report on one item with the same verdict.
   *
   * Per item, not per report: an admin looked at the content once and decided
   * once. Resolving reports individually would ask them to type the same
   * verdict N times and would leave an item half-open in the queue.
   */
  async resolveReports(input: {
    contentType: string;
    contentId: string;
    status: Extract<ReportStatus, 'actioned' | 'dismissed'>;
    resolution: string | null;
    resolvedByUserId: number;
  }): Promise<number> {
    const result = await this.db
      .update(boffMediaContentReports)
      .set({
        status: input.status,
        resolution: input.resolution,
        resolvedAt: new Date(),
        resolvedByUserId: input.resolvedByUserId,
      })
      .where(
        and(
          eq(boffMediaContentReports.contentType, input.contentType),
          eq(boffMediaContentReports.contentId, input.contentId),
          eq(boffMediaContentReports.status, REPORT_STATUS.OPEN),
        ),
      );
    // drizzle-mysql2 returns [ResultSetHeader, FieldPacket[]] — the count is on
    // the header, not on the array. Same defensive read as
    // `refresh-tokens.repository.ts`.
    const header = (Array.isArray(result) ? result[0] : result) as {
      affectedRows?: number;
    };
    return Number(header?.affectedRows ?? 0);
  }

  /**
   * How much trouble this author has been in, across every surface.
   *
   * Keyed on the snapshotted author columns, so it keeps working after the
   * content is hidden or gone — which is exactly when an admin wants it.
   */
  async authorTallies(
    userIds: number[],
    uuids: string[],
  ): Promise<Map<string, AuthorTally>> {
    const out = new Map<string, AuthorTally>();
    if (userIds.length === 0 && uuids.length === 0) return out;

    const clauses: SQL[] = [];
    if (userIds.length > 0) {
      clauses.push(inArray(boffMediaContentReports.authorUserId, userIds));
    }
    if (uuids.length > 0) {
      clauses.push(inArray(boffMediaContentReports.authorUuid, uuids));
    }

    const rows = await this.db
      .select({
        authorUserId: boffMediaContentReports.authorUserId,
        authorUuid: boffMediaContentReports.authorUuid,
        status: boffMediaContentReports.status,
        n: sql<number>`COUNT(*)`,
      })
      .from(boffMediaContentReports)
      .where(clauses.length === 1 ? clauses[0] : or(...clauses))
      .groupBy(
        boffMediaContentReports.authorUserId,
        boffMediaContentReports.authorUuid,
        boffMediaContentReports.status,
      );

    for (const row of rows) {
      const key = authorKey(row.authorUserId, row.authorUuid);
      if (!key) continue;
      const tally =
        out.get(key) ??
        ({
          key,
          openReports: 0,
          actionedReports: 0,
          totalReports: 0,
        } satisfies AuthorTally);
      const n = Number(row.n);
      tally.totalReports += n;
      if (row.status === REPORT_STATUS.OPEN) tally.openReports += n;
      if (row.status === REPORT_STATUS.ACTIONED) tally.actionedReports += n;
      out.set(key, tally);
    }

    return out;
  }

  // ─── hide ledger ──────────────────────────────────────────────────────────

  async findModeration(
    contentType: string,
    contentId: string,
  ): Promise<typeof boffMediaContentModeration.$inferSelect | undefined> {
    const [row] = await this.db
      .select()
      .from(boffMediaContentModeration)
      .where(
        and(
          eq(boffMediaContentModeration.contentType, contentType),
          eq(boffMediaContentModeration.contentId, contentId),
        ),
      )
      .limit(1);
    return row;
  }

  /** The hidden items on one page of the queue, resolved in a single query. */
  async findHiddenKeys(
    keys: Array<{ contentType: string; contentId: string }>,
  ): Promise<Set<string>> {
    if (keys.length === 0) return new Set();
    const rows = await this.db
      .select({
        contentType: boffMediaContentModeration.contentType,
        contentId: boffMediaContentModeration.contentId,
      })
      .from(boffMediaContentModeration)
      .where(
        and(
          or(
            ...keys.map((k) =>
              and(
                eq(boffMediaContentModeration.contentType, k.contentType),
                eq(boffMediaContentModeration.contentId, k.contentId),
              ),
            ),
          ),
          sql`${boffMediaContentModeration.hiddenAt} IS NOT NULL`,
        ),
      );
    return new Set(rows.map((r) => `${r.contentType}:${r.contentId}`));
  }

  /**
   * Latches (or clears) the hide decision. Upsert, because the row has to
   * survive an unhide: `hidden_reason` and the ledger's own existence are what
   * later tell an unhide from "was never touched".
   */
  async setHidden(input: {
    contentType: string;
    contentId: string;
    hiddenAt: Date | null;
    hiddenByUserId: number;
    hiddenReason: string | null;
  }): Promise<void> {
    await this.db
      .insert(boffMediaContentModeration)
      .values({
        contentType: input.contentType,
        contentId: input.contentId,
        hiddenAt: input.hiddenAt,
        hiddenByUserId: input.hiddenByUserId,
        hiddenReason: input.hiddenReason,
      })
      .onDuplicateKeyUpdate({
        set: {
          hiddenAt: input.hiddenAt,
          hiddenByUserId: input.hiddenByUserId,
          hiddenReason: input.hiddenReason,
        },
      });
  }

  /**
   * Applies the decision to the surface's own hide column.
   *
   * Generic over the table on purpose: the descriptor names the column, so a
   * new `column`-strategy surface needs no code here.
   */
  async setSurfaceHideColumn(
    surface: ContentSurface,
    id: number | string,
    value: Date | null,
  ): Promise<void> {
    if (!surface.hideColumn) {
      throw new Error(
        `surface ${surface.contentType} has hide strategy 'column' but no hideColumn`,
      );
    }
    // THE TRAP: `.set()` is keyed on Drizzle's JS PROPERTY names, not on the SQL
    // column names, and it silently ignores a key it does not recognise. Using
    // `column.name` here ("deleted_at") would update zero columns, return
    // success, and leave reported content up. `getTableColumns` is the only
    // mapping back from the column object to the property Drizzle expects.
    const property = Object.entries(getTableColumns(surface.table)).find(
      ([, column]) => column === surface.hideColumn,
    )?.[0];
    if (!property) {
      throw new Error(
        `hideColumn for ${surface.contentType} does not belong to its own table`,
      );
    }

    await this.db
      .update(surface.table)
      .set({ [property]: value } as never)
      .where(eq(surface.idColumn, id));
  }

  // ─── generic content resolution ───────────────────────────────────────────

  /**
   * Loads one item from whichever table its surface names.
   *
   * The selection is built from the descriptor's columns, so this one method
   * serves every registered surface. Aliased to stable keys (`id`, `excerpt0`…)
   * because the caller cannot know the column names of a surface it was never
   * written for.
   */
  async loadContent(
    surface: ContentSurface,
    id: number | string,
  ): Promise<{
    id: number | string;
    excerpts: Array<string | null>;
    authorUserId: number | null;
    authorUuid: string | null;
    createdAt: Date | null;
    hiddenByColumn: boolean;
  } | null> {
    const selection: Record<string, AnyMySqlColumn> = { id: surface.idColumn };
    surface.excerptColumns.forEach((c, i) => {
      selection[`excerpt${i}`] = c;
    });
    if (surface.authorUserIdColumn) {
      selection.authorUserId = surface.authorUserIdColumn;
    }
    if (surface.authorUuidColumn) {
      selection.authorUuid = surface.authorUuidColumn;
    }
    if (surface.createdAtColumn) selection.createdAt = surface.createdAtColumn;
    if (surface.hideColumn) selection.hideValue = surface.hideColumn;

    const [row] = (await this.db
      .select(selection)
      .from(surface.table)
      .where(eq(surface.idColumn, id))
      .limit(1)) as unknown as Array<Record<string, unknown>>;

    if (!row) return null;

    return {
      id: row.id as number | string,
      excerpts: surface.excerptColumns.map(
        (_, i) => (row[`excerpt${i}`] as string | null) ?? null,
      ),
      authorUserId: (row.authorUserId as number | null) ?? null,
      authorUuid: (row.authorUuid as string | null) ?? null,
      createdAt: (row.createdAt as Date | null) ?? null,
      hiddenByColumn: row.hideValue != null,
    };
  }

  // ─── sanctions ────────────────────────────────────────────────────────────

  async insertSanction(input: {
    subjectUserId: number | null;
    subjectUuid: string | null;
    kind: SanctionKind;
    reason: string;
    reportId: number | null;
    expiresAt: Date | null;
    issuedByUserId: number;
  }): Promise<number> {
    const [res] = await this.db
      .insert(boffMediaModerationSanctions)
      .values(input)
      .$returningId();
    return res.id;
  }

  /**
   * A live content ban for this account, if there is one.
   *
   * "Live" is `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now)`
   * — the NULL expiry is the indefinite ban, so it must not be read as expired.
   */
  async findActiveContentBan(subject: {
    userId?: number | null;
    uuid?: string | null;
  }): Promise<ModerationSanction | undefined> {
    const identity: SQL[] = [];
    if (subject.userId != null) {
      identity.push(
        eq(boffMediaModerationSanctions.subjectUserId, subject.userId),
      );
    }
    if (subject.uuid) {
      identity.push(eq(boffMediaModerationSanctions.subjectUuid, subject.uuid));
    }
    if (identity.length === 0) return undefined;

    const [row] = await this.db
      .select()
      .from(boffMediaModerationSanctions)
      .where(
        and(
          identity.length === 1 ? identity[0] : or(...identity),
          eq(boffMediaModerationSanctions.kind, SANCTION_KIND.CONTENT_BAN),
          isNull(boffMediaModerationSanctions.revokedAt),
          or(
            isNull(boffMediaModerationSanctions.expiresAt),
            sql`${boffMediaModerationSanctions.expiresAt} > NOW()`,
          ),
        ),
      )
      .limit(1);
    return row;
  }

  /** Sanction history for one author, newest first. */
  async listSanctions(subject: {
    userId?: number | null;
    uuid?: string | null;
  }): Promise<ModerationSanction[]> {
    const identity: SQL[] = [];
    if (subject.userId != null) {
      identity.push(
        eq(boffMediaModerationSanctions.subjectUserId, subject.userId),
      );
    }
    if (subject.uuid) {
      identity.push(eq(boffMediaModerationSanctions.subjectUuid, subject.uuid));
    }
    if (identity.length === 0) return [];

    return this.db
      .select()
      .from(boffMediaModerationSanctions)
      .where(identity.length === 1 ? identity[0] : or(...identity))
      .orderBy(desc(boffMediaModerationSanctions.createdAt))
      .limit(20);
  }

  /** Usernames for the accounts shown on one page of the queue. */
  async usernamesFor(userIds: number[]): Promise<Map<number, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.db
      .select({ id: boffMediaUsers.id, username: boffMediaUsers.username })
      .from(boffMediaUsers)
      .where(inArray(boffMediaUsers.id, userIds));
    return new Map(rows.map((r) => [r.id, r.username]));
  }
}

/**
 * One string for an author whichever identity system they came from, so the
 * two tallies can share a map. `u:` and `p:` (player) cannot collide: an int
 * id and a uuid never produce the same suffix.
 */
export function authorKey(
  userId: number | null | undefined,
  uuid: string | null | undefined,
): string | null {
  if (userId != null) return `u:${userId}`;
  if (uuid) return `p:${uuid}`;
  return null;
}
