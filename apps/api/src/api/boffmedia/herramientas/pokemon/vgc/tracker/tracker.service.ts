import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackerRepository } from './tracker.repository';
import { CreatePresetDto, CreateSessionDto, CreateMatchDto, UpdateMatchDto } from './dto';
import { VgcSession, VgcTeamPreset, VgcMatch } from '@/_db/schema/VgcTracker';

@Injectable()
export class TrackerService {
  constructor(private readonly repo: TrackerRepository) {}

  // ─── Presets ────────────────────────────────────────────────────────────────

  async getPresets(userId?: number): Promise<VgcTeamPreset[]> {
    return this.repo.findPresets(userId);
  }

  async upsertPreset(id: string, dto: CreatePresetDto): Promise<void> {
    await this.repo.upsertPreset({ id, ...dto });
  }

  async deletePreset(id: string): Promise<void> {
    await this.repo.deletePreset(id);
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async getSessions(userId?: number): Promise<VgcSession[]> {
    return this.repo.findSessions(userId);
  }

  async upsertSession(dto: CreateSessionDto): Promise<void> {
    await this.repo.upsertSession(dto as any);
  }

  async deleteSession(id: string): Promise<void> {
    await this.repo.deleteSession(id);
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  async getMatchesForSession(sessionId: string): Promise<VgcMatch[]> {
    return this.repo.findMatchesForSession(sessionId);
  }

  async upsertMatch(dto: CreateMatchDto): Promise<void> {
    await this.repo.upsertMatch({
      ...dto,
      notes: [],
    });
  }

  async updateMatch(id: string, dto: UpdateMatchDto): Promise<VgcMatch> {
    const existing = await this.repo.findMatch(id);
    if (!existing) throw new NotFoundException(`Match "${id}" not found.`);
    await this.repo.upsertMatch({
      id,
      sessionId: existing.sessionId,
      format: existing.format,
      myTeam: dto.myTeam ?? JSON.parse(existing.myTeam as unknown as string),
      opponentTeam: dto.opponentTeam ?? JSON.parse(existing.opponentTeam as unknown as string),
      result: dto.result ?? existing.result,
      eloAfter: dto.eloAfter ?? existing.eloAfter,
      opponentElo: dto.opponentElo ?? existing.opponentElo,
      notes: dto.notes ?? JSON.parse(existing.notes as unknown as string),
      completedAt: dto.completedAt ? new Date(dto.completedAt) : existing.completedAt,
    });
    return this.repo.findMatch(id);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.repo.deleteMatch(id);
  }
}
