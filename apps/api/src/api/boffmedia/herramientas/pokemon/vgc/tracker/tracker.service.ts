import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TrackerRepository } from './tracker.repository';
import {
  CreatePresetDto,
  CreateSessionDto,
  CreateMatchDto,
  UpdateMatchDto,
  UpsertSeriesDto,
} from './dto';
import {
  VgcSession,
  VgcTeamPreset,
  VgcMatch,
  VgcSeries,
} from '@/_db/schema/VgcTracker';

// Convert a Date | null/undefined to unix ms, or pass through a number as-is
function toMs(value: Date | number | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  return value instanceof Date ? value.getTime() : undefined;
}

@Injectable()
export class TrackerService {
  constructor(private readonly repo: TrackerRepository) {}

  private ensureNoConflict(
    label: string,
    clientUpdatedAt: number | undefined,
    serverUpdatedAt: Date | number | null | undefined,
  ): void {
    if (clientUpdatedAt === undefined) return;
    const serverMs = toMs(serverUpdatedAt);
    if (serverMs === undefined) return;
    if (clientUpdatedAt < serverMs) {
      throw new ConflictException(
        `${label} has a newer server version. Pull latest data and retry the write.`,
      );
    }
  }

  private ensureOwnership(
    entityUserId: number | null | undefined,
    userId: number,
    label: string,
  ): void {
    if (entityUserId == null || entityUserId !== userId) {
      throw new NotFoundException(`${label} not found.`);
    }
  }

  // ─── Presets ────────────────────────────────────────────────────────────────

  async getPresets(userId: number): Promise<VgcTeamPreset[]> {
    return this.repo.findPresets(userId);
  }

  async upsertPreset(
    userId: number,
    id: string,
    dto: CreatePresetDto,
  ): Promise<void> {
    const existing = await this.repo.findPreset(id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Preset "${id}"`);
      this.ensureNoConflict(
        `Preset "${id}"`,
        dto.clientUpdatedAt,
        existing.updatedAt,
      );
    }

    await this.repo.upsertPreset({
      id,
      userId,
      name: dto.name,
      regulationId: dto.regulationId,
      exportString: dto.exportString,
      slots: dto.slots,
      currentVersion: dto.currentVersion,
      versions: dto.versions,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    });
  }

  async deletePreset(userId: number, id: string): Promise<void> {
    const existing = await this.repo.findPreset(id);
    if (!existing) throw new NotFoundException(`Preset "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Preset "${id}"`);
    await this.repo.deletePreset(id, userId);
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async getSessions(userId: number): Promise<VgcSession[]> {
    return this.repo.findSessions(userId);
  }

  async upsertSession(
    userId: number,
    dto: CreateSessionDto & { id: string },
  ): Promise<void> {
    const existing = await this.repo.findSession(dto.id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Session "${dto.id}"`);
      this.ensureNoConflict(
        `Session "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.updatedAt,
      );
    }

    await this.repo.upsertSession({
      id: dto.id,
      userId,
      label: dto.label,
      format: dto.format,
      regulationId: dto.regulationId,
      type: dto.type,
      activePresetId: dto.activePresetId,
      startElo: dto.startElo,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
      archivedAt: dto.archivedAt,
      tournamentName: dto.tournamentName,
      limitlessTournamentId: dto.limitlessTournamentId,
      sessionNotes: dto.sessionNotes,
    });
  }

  async deleteSession(userId: number, id: string): Promise<void> {
    const existing = await this.repo.findSession(id);
    if (!existing) throw new NotFoundException(`Session "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Session "${id}"`);
    await this.repo.deleteSession(id, userId);
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  async getMatchesForSession(
    userId: number,
    sessionId: string,
  ): Promise<VgcMatch[]> {
    const session = await this.repo.findSession(sessionId);
    if (!session)
      throw new NotFoundException(`Session "${sessionId}" not found.`);
    this.ensureOwnership(session.userId, userId, `Session "${sessionId}"`);
    return this.repo.findMatchesForSession(sessionId);
  }

  async upsertMatch(userId: number, dto: CreateMatchDto): Promise<void> {
    const session = await this.repo.findSession(dto.sessionId);
    if (!session)
      throw new NotFoundException(`Session "${dto.sessionId}" not found.`);
    this.ensureOwnership(session.userId, userId, `Session "${dto.sessionId}"`);

    const existing = await this.repo.findMatch(dto.id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Match "${dto.id}"`);
      this.ensureNoConflict(
        `Match "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.updatedAt,
      );
    }

    await this.repo.upsertMatch({
      id: dto.id,
      sessionId: dto.sessionId,
      format: dto.format,
      userId,
      myTeam: dto.myTeam,
      opponentTeam: dto.opponentTeam,
      opponentName: dto.opponentName,
      opponentArchetype: dto.opponentArchetype,
      result: dto.result,
      outcomeTag: dto.outcomeTag,
      turnCount: dto.turnCount,
      eloAfter: dto.eloAfter,
      opponentElo: dto.opponentElo,
      notes: dto.notes ?? [],
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
    });
  }

  async updateMatch(
    userId: number,
    id: string,
    dto: UpdateMatchDto,
  ): Promise<VgcMatch> {
    const existing = await this.repo.findMatch(id);
    if (!existing) throw new NotFoundException(`Match "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Match "${id}"`);
    await this.repo.upsertMatch({
      id,
      sessionId: existing.sessionId,
      userId,
      format: existing.format,
      myTeam: dto.myTeam ?? JSON.parse(existing.myTeam as unknown as string),
      opponentTeam:
        dto.opponentTeam ??
        JSON.parse(existing.opponentTeam as unknown as string),
      opponentName: dto.opponentName ?? existing.opponentName,
      opponentArchetype: dto.opponentArchetype ?? existing.opponentArchetype,
      result: dto.result ?? existing.result,
      outcomeTag: dto.outcomeTag ?? existing.outcomeTag,
      turnCount: dto.turnCount ?? existing.turnCount,
      eloAfter: dto.eloAfter ?? existing.eloAfter,
      opponentElo: dto.opponentElo ?? existing.opponentElo,
      notes: dto.notes ?? JSON.parse(existing.notes as unknown as string),
      completedAt: dto.completedAt
        ? new Date(dto.completedAt)
        : existing.completedAt,
    });
    return this.repo.findMatch(id);
  }

  async deleteMatch(userId: number, id: string): Promise<void> {
    const existing = await this.repo.findMatch(id);
    if (!existing) throw new NotFoundException(`Match "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Match "${id}"`);
    await this.repo.deleteMatch(id, userId);
  }

  // ─── Series ──────────────────────────────────────────────────────────────────

  async getSeriesForSession(
    userId: number,
    sessionId: string,
  ): Promise<VgcSeries[]> {
    const session = await this.repo.findSession(sessionId);
    if (!session)
      throw new NotFoundException(`Session "${sessionId}" not found.`);
    this.ensureOwnership(session.userId, userId, `Session "${sessionId}"`);
    return this.repo.findSeriesForSession(sessionId);
  }

  async upsertSeries(
    userId: number,
    dto: UpsertSeriesDto & { id: string },
  ): Promise<void> {
    const session = await this.repo.findSession(dto.sessionId);
    if (!session)
      throw new NotFoundException(`Session "${dto.sessionId}" not found.`);
    this.ensureOwnership(session.userId, userId, `Session "${dto.sessionId}"`);

    const existing = await this.repo.findSeries(dto.id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Series "${dto.id}"`);
      this.ensureNoConflict(
        `Series "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.updatedAt,
      );
    }

    await this.repo.upsertSeries({
      id: dto.id,
      sessionId: dto.sessionId,
      createdAt: dto.createdAt,
      completedAt: dto.completedAt,
      roundNumber: dto.roundNumber,
      opponentName: dto.opponentName,
      opponentArchetype: dto.opponentArchetype,
      userId,
      myTeam: typeof dto.myTeam === 'string' ? dto.myTeam : dto.myTeam,
      opponentTeam:
        typeof dto.opponentTeam === 'string'
          ? dto.opponentTeam
          : dto.opponentTeam,
      games: dto.games ?? [],
      seriesResult: dto.seriesResult,
      notes: dto.notes ?? [],
    });
  }

  async deleteSeries(userId: number, id: string): Promise<void> {
    const existing = await this.repo.findSeries(id);
    if (!existing) throw new NotFoundException(`Series "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Series "${id}"`);
    await this.repo.deleteSeries(id, userId);
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────────

  async syncAll(userId: number) {
    const raw = await this.repo.findAllByUser(userId);

    // Map datetime columns → unix ms for the client
    const sessions = raw.sessions.map((s) => ({
      ...s,
      startedAt: toMs(s.startedAt as any),
      createdAt: toMs(s.createdAt as any),
      updatedAt: toMs(s.updatedAt as any),
    }));

    const matches = raw.matches.map((m) => ({
      ...m,
      createdAt: toMs(m.createdAt as any),
      completedAt: toMs(m.completedAt as any),
      updatedAt: toMs(m.updatedAt as any),
      myTeam: typeof m.myTeam === 'string' ? JSON.parse(m.myTeam) : m.myTeam,
      opponentTeam:
        typeof m.opponentTeam === 'string'
          ? JSON.parse(m.opponentTeam)
          : m.opponentTeam,
      notes: typeof m.notes === 'string' ? JSON.parse(m.notes) : m.notes,
    }));

    const series = raw.series.map((s) => ({
      ...s,
      updatedAt: toMs(s.updatedAt as any),
      myTeam: typeof s.myTeam === 'string' ? JSON.parse(s.myTeam) : s.myTeam,
      opponentTeam:
        typeof s.opponentTeam === 'string'
          ? JSON.parse(s.opponentTeam)
          : s.opponentTeam,
      games: typeof s.games === 'string' ? JSON.parse(s.games) : s.games,
      notes: typeof s.notes === 'string' ? JSON.parse(s.notes) : s.notes,
    }));

    const presets = raw.presets.map((p) => ({
      ...p,
      createdAt: toMs(p.createdAt as any),
      updatedAt: toMs(p.updatedAt as any),
      slots: typeof p.slots === 'string' ? JSON.parse(p.slots) : p.slots,
      versions:
        typeof p.versions === 'string' ? JSON.parse(p.versions) : p.versions,
    }));

    return { sessions, matches, series, presets };
  }
}
