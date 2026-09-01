import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, desc, isNull, isNotNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcSessions,
  vgcTeamPresets,
  vgcMatches,
  vgcSeries,
  VgcSession,
  VgcTeamPreset,
  VgcMatch,
  VgcSeries,
  TeamSnapshotData,
  MatchNoteData,
  PresetSlotData,
} from '@/_db/schema/VgcTracker';

@Injectable()
export class TrackerRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ─── Presets ────────────────────────────────────────────────────────────────

  async findPresets(userId?: number): Promise<VgcTeamPreset[]> {
    const query = this.db
      .select()
      .from(vgcTeamPresets)
      .where(
        userId === undefined
          ? isNull(vgcTeamPresets.deletedAt)
          : and(
              eq(vgcTeamPresets.userId, userId),
              isNull(vgcTeamPresets.deletedAt),
            ),
      );
    return query;
  }

  /**
   * By id, tombstones INCLUDED.
   *
   * Every caller is a write path deciding what to do about this row, and
   * "already deleted" is the answer it most needs — hiding it would turn an
   * upsert over a tombstone into a silent resurrection.
   */
  async findPreset(id: string): Promise<VgcTeamPreset | undefined> {
    const [row] = await this.db
      .select()
      .from(vgcTeamPresets)
      .where(eq(vgcTeamPresets.id, id));
    return row;
  }

  async upsertPreset(data: {
    id: string;
    userId?: number;
    name: string;
    regulationId: string;
    exportString: string;
    slots: PresetSlotData[];
    currentVersion?: number;
    versions?: any[];
    createdAt?: Date;
    updatedAt?: Date;
    clientUpdatedAt?: number;
    deletedAt?: number | null;
  }): Promise<void> {
    const row = {
      id: data.id,
      userId: data.userId,
      name: data.name,
      regulationId: data.regulationId,
      exportString: data.exportString,
      slots: JSON.stringify(data.slots),
      currentVersion: data.currentVersion ?? 1,
      versions: JSON.stringify(data.versions ?? []),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      clientUpdatedAt: data.clientUpdatedAt,
      deletedAt: data.deletedAt,
    };

    await this.db
      .insert(vgcTeamPresets)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          name: data.name,
          regulationId: data.regulationId,
          exportString: data.exportString,
          slots: JSON.stringify(data.slots),
          currentVersion: data.currentVersion ?? 1,
          versions: JSON.stringify(data.versions ?? []),
          updatedAt: data.updatedAt,
          clientUpdatedAt: data.clientUpdatedAt,
          deletedAt: data.deletedAt,
        },
      });
  }

  /** Soft — see the tombstone note on the schema. */
  async deletePreset(id: string, userId: number, at: number): Promise<void> {
    await this.db
      .update(vgcTeamPresets)
      .set({ deletedAt: at })
      .where(and(eq(vgcTeamPresets.id, id), eq(vgcTeamPresets.userId, userId)));
  }

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
      .where(and(eq(vgcMatches.sessionId, sessionId), isNull(vgcMatches.deletedAt)))
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
      .where(and(eq(vgcSeries.sessionId, sessionId), isNull(vgcSeries.deletedAt)))
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
    presets: VgcTeamPreset[];
    deleted: {
      sessions: string[];
      matches: string[];
      series: string[];
      presets: string[];
    };
  }> {
    const live = <T extends typeof vgcSessions | typeof vgcMatches | typeof vgcSeries | typeof vgcTeamPresets>(
      table: T,
    ) => and(eq(table.userId, userId), isNull(table.deletedAt));

    const tombstones = <T extends typeof vgcSessions | typeof vgcMatches | typeof vgcSeries | typeof vgcTeamPresets>(
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
      presets,
      deletedSessions,
      deletedMatches,
      deletedSeries,
      deletedPresets,
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
      this.db
        .select()
        .from(vgcTeamPresets)
        .where(live(vgcTeamPresets))
        .orderBy(desc(vgcTeamPresets.createdAt)),
      tombstones(vgcSessions),
      tombstones(vgcMatches),
      tombstones(vgcSeries),
      tombstones(vgcTeamPresets),
    ]);

    return {
      sessions,
      matches,
      series: seriesList,
      presets,
      deleted: {
        sessions: deletedSessions.map((r) => r.id),
        matches: deletedMatches.map((r) => r.id),
        series: deletedSeries.map((r) => r.id),
        presets: deletedPresets.map((r) => r.id),
      },
    };
  }
}
