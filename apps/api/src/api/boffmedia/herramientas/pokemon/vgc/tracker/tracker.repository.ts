import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, desc } from 'drizzle-orm';
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
    const query = this.db.select().from(vgcTeamPresets);
    if (userId !== undefined)
      return query.where(eq(vgcTeamPresets.userId, userId));
    return query;
  }

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
        },
      });
  }

  async deletePreset(id: string, userId: number): Promise<void> {
    await this.db
      .delete(vgcTeamPresets)
      .where(and(eq(vgcTeamPresets.id, id), eq(vgcTeamPresets.userId, userId)));
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async findSessions(userId?: number): Promise<VgcSession[]> {
    const query = this.db
      .select()
      .from(vgcSessions)
      .orderBy(desc(vgcSessions.startedAt));
    if (userId !== undefined)
      return query.where(eq(vgcSessions.userId, userId));
    return query;
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

  async deleteSession(id: string, userId: number): Promise<void> {
    await this.db
      .delete(vgcSessions)
      .where(and(eq(vgcSessions.id, id), eq(vgcSessions.userId, userId)));
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  async findMatchesForSession(sessionId: string): Promise<VgcMatch[]> {
    return this.db
      .select()
      .from(vgcMatches)
      .where(eq(vgcMatches.sessionId, sessionId))
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

  async deleteMatch(id: string, userId: number): Promise<void> {
    await this.db
      .delete(vgcMatches)
      .where(and(eq(vgcMatches.id, id), eq(vgcMatches.userId, userId)));
  }

  // ─── Series ──────────────────────────────────────────────────────────────────

  async findSeriesForSession(sessionId: string): Promise<VgcSeries[]> {
    return this.db
      .select()
      .from(vgcSeries)
      .where(eq(vgcSeries.sessionId, sessionId))
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

  async deleteSeries(id: string, userId: number): Promise<void> {
    await this.db
      .delete(vgcSeries)
      .where(and(eq(vgcSeries.id, id), eq(vgcSeries.userId, userId)));
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────────

  async findAllByUser(userId: number): Promise<{
    sessions: VgcSession[];
    matches: VgcMatch[];
    series: VgcSeries[];
    presets: VgcTeamPreset[];
  }> {
    const [sessions, matches, seriesList, presets] = await Promise.all([
      this.db
        .select()
        .from(vgcSessions)
        .where(eq(vgcSessions.userId, userId))
        .orderBy(desc(vgcSessions.startedAt)),
      this.db
        .select()
        .from(vgcMatches)
        .where(eq(vgcMatches.userId, userId))
        .orderBy(desc(vgcMatches.createdAt)),
      this.db
        .select()
        .from(vgcSeries)
        .where(eq(vgcSeries.userId, userId))
        .orderBy(desc(vgcSeries.createdAt)),
      this.db
        .select()
        .from(vgcTeamPresets)
        .where(eq(vgcTeamPresets.userId, userId))
        .orderBy(desc(vgcTeamPresets.createdAt)),
    ]);
    return { sessions, matches, series: seriesList, presets };
  }
}
