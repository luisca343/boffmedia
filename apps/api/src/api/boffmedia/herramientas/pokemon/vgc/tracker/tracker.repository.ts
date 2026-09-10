import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, desc, isNull, isNotNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcSessions,
  vgcMatches,
  vgcSeries,
  VgcSession,
  VgcMatch,
  VgcSeries,
  TeamSnapshotData,
  MatchNoteData,
} from '@/_db/schema/VgcTracker';

@Injectable()
export class TrackerRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // Team persistence is owned by the Battlesim teambuilder.

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async findSessions(userId?: number): Promise<VgcSession[]> {
    return this.db
      .select()
      .from(vgcSessions)
      .where(
        userId === undefined
          ? isNull(vgcSessions.deletedAt)
          : and(eq(vgcSessions.userId, userId), isNull(vgcSessions.deletedAt)),
      )
      .orderBy(desc(vgcSessions.startedAt));
  }

  async findSession(id: string): Promise<VgcSession | undefined> {
    const [row] = await this.db
      .select()
      .from(vgcSessions)
      .where(eq(vgcSessions.id, id));
    return row;
  }

  async upsertSession(
    data: Partial<VgcSession> & { id: string },
  ): Promise<void> {
    await this.db
      .insert(vgcSessions)
      .values(data as any)
      .onDuplicateKeyUpdate({ set: data as any });
  }

  /**
   * Soft, and it has to cascade by hand.
   *
   * The FK's `ON DELETE CASCADE` only fires for a real DELETE, so a
   * soft-deleted session would leave its matches and series live: they would
   * come back in the next sync pull as rows whose parent is gone, and any
   * device that had already dropped them locally would push them again.
   */
  async deleteSession(id: string, userId: number, at: number): Promise<void> {
    await Promise.all([
      this.db
        .update(vgcSessions)
        .set({ deletedAt: at })
        .where(and(eq(vgcSessions.id, id), eq(vgcSessions.userId, userId))),
      this.db
        .update(vgcMatches)
        .set({ deletedAt: at })
        .where(
          and(
            eq(vgcMatches.sessionId, id),
            eq(vgcMatches.userId, userId),
            isNull(vgcMatches.deletedAt),
          ),
        ),
      this.db
        .update(vgcSeries)
        .set({ deletedAt: at })
        .where(
          and(
            eq(vgcSeries.sessionId, id),
            eq(vgcSeries.userId, userId),
            isNull(vgcSeries.deletedAt),
          ),
        ),
    ]);
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  async findMatchesForSession(sessionId: string): Promise<VgcMatch[]> {
    return this.db
      .select()
      .from(vgcMatches)
      .where(
        and(eq(vgcMatches.sessionId, sessionId), isNull(vgcMatches.deletedAt)),
      )
      .orderBy(desc(vgcMatches.createdAt));
  }

  async findMatch(id: string): Promise<VgcMatch | undefined> {
    const [row] = await this.db
      .select()
      .from(vgcMatches)
      .where(eq(vgcMatches.id, id));
    return row;
  }

  async upsertMatch(data: {
    id: string;
    sessionId: string;
    userId?: number;
    format: 'BO1' | 'BO3';
    createdAt?: Date;
    myTeam: TeamSnapshotData;
    opponentTeam: TeamSnapshotData;
    opponentName?: string;
    opponentArchetype?: string;
    result?: 'win' | 'loss' | 'draw';
    outcomeTag?: string;
    turnCount?: number;
    eloAfter?: number;
    opponentElo?: number;
    notes: MatchNoteData[];
    completedAt?: Date;
    clientUpdatedAt?: number;
    deletedAt?: number | null;
  }): Promise<void> {
    const row = {
      ...data,
      myTeam: JSON.stringify(data.myTeam),
      opponentTeam: JSON.stringify(data.opponentTeam),
      notes: JSON.stringify(data.notes),
    };
    await this.db
      .insert(vgcMatches)
      .values(row as any)
      .onDuplicateKeyUpdate({ set: row as any });
  }

  async deleteMatch(id: string, userId: number, at: number): Promise<void> {
    await this.db
      .update(vgcMatches)
      .set({ deletedAt: at })
      .where(and(eq(vgcMatches.id, id), eq(vgcMatches.userId, userId)));
  }

  // ─── Series ──────────────────────────────────────────────────────────────────

  async findSeriesForSession(sessionId: string): Promise<VgcSeries[]> {
    return this.db
      .select()
      .from(vgcSeries)
      .where(
        and(eq(vgcSeries.sessionId, sessionId), isNull(vgcSeries.deletedAt)),
      )
      .orderBy(desc(vgcSeries.createdAt));
  }

  async findSeries(id: string): Promise<VgcSeries | undefined> {
    const [row] = await this.db
      .select()
      .from(vgcSeries)
      .where(eq(vgcSeries.id, id));
    return row;
  }

  async upsertSeries(data: {
    id: string;
    sessionId: string;
    userId?: number;
    createdAt: number;
    completedAt?: number;
    roundNumber?: number;
    opponentName?: string;
    opponentArchetype?: string;
    myTeam: any;
    opponentTeam: any;
    games: any[];
    seriesResult?: string;
    notes: any[];
    clientUpdatedAt?: number;
    deletedAt?: number | null;
  }): Promise<void> {
    const row = {
      ...data,
      myTeam: JSON.stringify(data.myTeam),
      opponentTeam: JSON.stringify(data.opponentTeam),
      games: JSON.stringify(data.games),
      notes: JSON.stringify(data.notes),
    };
    await this.db
      .insert(vgcSeries)
      .values(row as any)
      .onDuplicateKeyUpdate({ set: row as any });
  }

  async deleteSeries(id: string, userId: number, at: number): Promise<void> {
    await this.db
      .update(vgcSeries)
      .set({ deletedAt: at })
      .where(and(eq(vgcSeries.id, id), eq(vgcSeries.userId, userId)));
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────────

  /**
   * Everything one account holds: the live rows, and the ids of the rows it has
   * deleted.
   *
   * The tombstone ids are the half that makes deleting work across devices. A
   * device that was offline for the delete cannot tell "deleted" from "never
   * synced" by absence alone — both look like a row the server does not have —
   * and it guesses "never synced" and pushes it back. So absence stops being
   * the signal and the id list becomes it.
   */
  async findAllByUser(userId: number): Promise<{
    sessions: VgcSession[];
    matches: VgcMatch[];
    series: VgcSeries[];
    deleted: {
      sessions: string[];
      matches: string[];
      series: string[];
    };
  }> {
    const live = <
      T extends typeof vgcSessions | typeof vgcMatches | typeof vgcSeries,
    >(
      table: T,
    ) => and(eq(table.userId, userId), isNull(table.deletedAt));

    const tombstones = <
      T extends typeof vgcSessions | typeof vgcMatches | typeof vgcSeries,
    >(
      table: T,
    ) =>
      this.db
        .select({ id: table.id })
        .from(table as any)
        .where(and(eq(table.userId, userId), isNotNull(table.deletedAt)));

    const [
      sessions,
      matches,
      seriesList,
      deletedSessions,
      deletedMatches,
      deletedSeries,
    ] = await Promise.all([
      this.db
        .select()
        .from(vgcSessions)
        .where(live(vgcSessions))
        .orderBy(desc(vgcSessions.startedAt)),
      this.db
        .select()
        .from(vgcMatches)
        .where(live(vgcMatches))
        .orderBy(desc(vgcMatches.createdAt)),
      this.db
        .select()
        .from(vgcSeries)
        .where(live(vgcSeries))
        .orderBy(desc(vgcSeries.createdAt)),
      tombstones(vgcSessions),
      tombstones(vgcMatches),
      tombstones(vgcSeries),
    ]);

    return {
      sessions,
      matches,
      series: seriesList,
      deleted: {
        sessions: deletedSessions.map((r) => r.id),
        matches: deletedMatches.map((r) => r.id),
        series: deletedSeries.map((r) => r.id),
      },
    };
  }
}
