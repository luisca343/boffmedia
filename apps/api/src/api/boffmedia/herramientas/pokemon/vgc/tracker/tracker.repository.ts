import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcSessions,
  vgcTeamPresets,
  vgcMatches,
  VgcSession,
  VgcTeamPreset,
  VgcMatch,
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
    if (userId) return query.where(eq(vgcTeamPresets.userId, userId));
    return query;
  }

  async findPreset(id: string): Promise<VgcTeamPreset | undefined> {
    const [row] = await this.db.select().from(vgcTeamPresets).where(eq(vgcTeamPresets.id, id));
    return row;
  }

  async upsertPreset(data: {
    id: string;
    userId?: number;
    name: string;
    regulationId: string;
    exportString: string;
    slots: PresetSlotData[];
  }): Promise<void> {
    await this.db.insert(vgcTeamPresets).values({
      ...data,
      slots: JSON.stringify(data.slots),
    }).onDuplicateKeyUpdate({
      set: {
        name: data.name,
        exportString: data.exportString,
        slots: JSON.stringify(data.slots),
      },
    });
  }

  async deletePreset(id: string): Promise<void> {
    await this.db.delete(vgcTeamPresets).where(eq(vgcTeamPresets.id, id));
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async findSessions(userId?: number): Promise<VgcSession[]> {
    const query = this.db.select().from(vgcSessions).orderBy(desc(vgcSessions.startedAt));
    if (userId) return query.where(eq(vgcSessions.userId, userId));
    return query;
  }

  async findSession(id: string): Promise<VgcSession | undefined> {
    const [row] = await this.db.select().from(vgcSessions).where(eq(vgcSessions.id, id));
    return row;
  }

  async upsertSession(data: Partial<VgcSession> & { id: string }): Promise<void> {
    await this.db.insert(vgcSessions).values(data as any).onDuplicateKeyUpdate({ set: data as any });
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.delete(vgcSessions).where(eq(vgcSessions.id, id));
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
    const [row] = await this.db.select().from(vgcMatches).where(eq(vgcMatches.id, id));
    return row;
  }

  async upsertMatch(data: {
    id: string;
    sessionId: string;
    userId?: number;
    format: 'BO1' | 'BO3';
    myTeam: TeamSnapshotData;
    opponentTeam: TeamSnapshotData;
    opponentName?: string;
    result?: 'win' | 'loss' | 'draw';
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
    await this.db.insert(vgcMatches).values(row as any).onDuplicateKeyUpdate({ set: row as any });
  }

  async deleteMatch(id: string): Promise<void> {
    await this.db.delete(vgcMatches).where(eq(vgcMatches.id, id));
  }
}
