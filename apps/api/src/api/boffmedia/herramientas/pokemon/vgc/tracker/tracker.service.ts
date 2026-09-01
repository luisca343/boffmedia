import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TrackerRepository } from './tracker.repository';
import {
  CreateTrackerPresetDto,
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

  /**
   * Refuse a write that is older than the one already stored.
   *
   * Both sides are CLIENT stamps. Comparing the incoming one against
   * `updated_at` — the server's own clock — was the same bug in two disguises:
   * a device running slow 409'd on writes that were perfectly fresh, and a
   * device running fast overwrote newer data without ever being asked. Two
   * client clocks can still disagree, but they disagree by seconds rather than
   * by whatever the server's drift happens to be.
   *
   * A row that predates the column (NULL) has no version to compare, so it is
   * accepted: the first write after this shipped is what establishes one.
   */
  private ensureNoConflict(
    label: string,
    clientUpdatedAt: number | undefined,
    storedClientUpdatedAt: number | null | undefined,
  ): void {
    if (clientUpdatedAt === undefined) return;
    if (storedClientUpdatedAt == null) return;
    if (clientUpdatedAt < storedClientUpdatedAt) {
      throw new ConflictException(
        `${label} has a newer server version. Pull latest data and retry the write.`,
      );
    }
  }

  /**
   * A child cannot be written under a session that has been deleted.
   *
   * Unconditionally, unlike `resolveTombstone` — a later stamp does NOT earn
   * the write here. Deleting a session is a decision about the whole group;
   * editing one match inside it is subordinate to that, and letting the finer
   * act win would leave a match whose parent the next pull reports as gone.
   * Refused as a conflict, so the client refreshes and drops both.
   */
  private ensureParentAlive(
    sessionId: string,
    deletedAt: number | null | undefined,
  ): void {
    if (deletedAt == null) return;
    throw new ConflictException(
      `Session "${sessionId}" was deleted on another device. Pull latest data before writing.`,
    );
  }

  /**
   * What an upsert should do when the row it targets is a tombstone.
   *
   * Deleting on one device while another edits the same row offline is a real
   * race with no answer that is right for everyone, so the rule is: the later
   * intent wins. An edit stamped AFTER the delete resurrects the row — someone
   * demonstrably wanted it after it was gone, and refusing would throw their
   * work away. An edit stamped before it is a write the deleter has already
   * superseded, and it is refused as a conflict so the client pulls, sees the
   * tombstone, and drops its copy.
   */
  private resolveTombstone(
    label: string,
    clientUpdatedAt: number | undefined,
    deletedAt: number | null | undefined,
  ): void {
    if (deletedAt == null) return;
    if (clientUpdatedAt !== undefined && clientUpdatedAt > deletedAt) return;
    throw new ConflictException(
      `${label} was deleted on another device. Pull latest data before writing.`,
    );
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
    dto: CreateTrackerPresetDto,
  ): Promise<void> {
    const existing = await this.repo.findPreset(id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Preset "${id}"`);
      this.ensureNoConflict(
        `Preset "${id}"`,
        dto.clientUpdatedAt,
        existing.clientUpdatedAt,
      );
      this.resolveTombstone(
        `Preset "${id}"`,
        dto.clientUpdatedAt,
        existing.deletedAt,
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
      // Persist the version this write establishes, and clear any tombstone —
      // reaching here means `resolveTombstone` judged the edit to be the later
      // intent.
      clientUpdatedAt: dto.clientUpdatedAt,
      deletedAt: null,
    });
  }

  /**
   * `clientDeletedAt` is the deleting device's clock, not ours, because it is
   * what a later edit is compared against — see `resolveTombstone`.
   *
   * Deleting something already deleted is a success, not a 404. The queue
   * replays, a device can be told to delete a row twice, and answering the
   * second one with an error turns a delete that worked into a red banner.
   */
  async deletePreset(
    userId: number,
    id: string,
    clientDeletedAt?: number,
  ): Promise<void> {
    const existing = await this.repo.findPreset(id);
    if (!existing) throw new NotFoundException(`Preset "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Preset "${id}"`);
    if (existing.deletedAt != null) return;
    await this.repo.deletePreset(id, userId, clientDeletedAt ?? Date.now());
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
        existing.clientUpdatedAt,
      );
      this.resolveTombstone(
        `Session "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.deletedAt,
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
      // Persist the version this write establishes, and clear any tombstone —
      // reaching here means `resolveTombstone` judged the edit to be the later
      // intent.
      clientUpdatedAt: dto.clientUpdatedAt,
      deletedAt: null,
    });
  }

  /**
   * `clientDeletedAt` is the deleting device's clock, not ours, because it is
   * what a later edit is compared against — see `resolveTombstone`.
   *
   * Deleting something already deleted is a success, not a 404. The queue
   * replays, a device can be told to delete a row twice, and answering the
   * second one with an error turns a delete that worked into a red banner.
   */
  async deleteSession(
    userId: number,
    id: string,
    clientDeletedAt?: number,
  ): Promise<void> {
    const existing = await this.repo.findSession(id);
    if (!existing) throw new NotFoundException(`Session "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Session "${id}"`);
    if (existing.deletedAt != null) return;
    await this.repo.deleteSession(id, userId, clientDeletedAt ?? Date.now());
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
    this.ensureParentAlive(dto.sessionId, session.deletedAt);

    const existing = await this.repo.findMatch(dto.id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Match "${dto.id}"`);
      this.ensureNoConflict(
        `Match "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.clientUpdatedAt,
      );
      this.resolveTombstone(
        `Match "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.deletedAt,
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
      // Persist the version this write establishes, and clear any tombstone —
      // reaching here means `resolveTombstone` judged the edit to be the later
      // intent.
      clientUpdatedAt: dto.clientUpdatedAt,
      deletedAt: null,
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
    if (existing.deletedAt != null)
      throw new NotFoundException(`Match "${id}" not found.`);
    await this.repo.upsertMatch({
      id,
      sessionId: existing.sessionId ?? '',
      userId,
      format: existing.format ?? '',
      myTeam: dto.myTeam ?? JSON.parse(existing.myTeam as unknown as string),
      opponentTeam:
        dto.opponentTeam ??
        JSON.parse(existing.opponentTeam as unknown as string),
      opponentName: dto.opponentName ?? existing.opponentName ?? undefined,
      opponentArchetype:
        dto.opponentArchetype ?? existing.opponentArchetype ?? undefined,
      result: dto.result ?? existing.result ?? undefined,
      outcomeTag: dto.outcomeTag ?? existing.outcomeTag ?? undefined,
      turnCount: dto.turnCount ?? existing.turnCount ?? undefined,
      eloAfter: dto.eloAfter ?? existing.eloAfter ?? undefined,
      opponentElo: dto.opponentElo ?? existing.opponentElo ?? undefined,
      notes: dto.notes ?? JSON.parse(existing.notes as unknown as string),
      completedAt: dto.completedAt
        ? new Date(dto.completedAt)
        : (existing.completedAt ?? undefined),
    });
    return this.repo.findMatch(id) as Promise<VgcMatch>;
  }

  /**
   * `clientDeletedAt` is the deleting device's clock, not ours, because it is
   * what a later edit is compared against — see `resolveTombstone`.
   *
   * Deleting something already deleted is a success, not a 404. The queue
   * replays, a device can be told to delete a row twice, and answering the
   * second one with an error turns a delete that worked into a red banner.
   */
  async deleteMatch(
    userId: number,
    id: string,
    clientDeletedAt?: number,
  ): Promise<void> {
    const existing = await this.repo.findMatch(id);
    if (!existing) throw new NotFoundException(`Match "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Match "${id}"`);
    if (existing.deletedAt != null) return;
    await this.repo.deleteMatch(id, userId, clientDeletedAt ?? Date.now());
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
    this.ensureParentAlive(dto.sessionId, session.deletedAt);

    const existing = await this.repo.findSeries(dto.id);
    if (existing) {
      this.ensureOwnership(existing.userId, userId, `Series "${dto.id}"`);
      this.ensureNoConflict(
        `Series "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.clientUpdatedAt,
      );
      this.resolveTombstone(
        `Series "${dto.id}"`,
        dto.clientUpdatedAt,
        existing.deletedAt,
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
      // Persist the version this write establishes, and clear any tombstone —
      // reaching here means `resolveTombstone` judged the edit to be the later
      // intent.
      clientUpdatedAt: dto.clientUpdatedAt,
      deletedAt: null,
    });
  }

  /**
   * `clientDeletedAt` is the deleting device's clock, not ours, because it is
   * what a later edit is compared against — see `resolveTombstone`.
   *
   * Deleting something already deleted is a success, not a 404. The queue
   * replays, a device can be told to delete a row twice, and answering the
   * second one with an error turns a delete that worked into a red banner.
   */
  async deleteSeries(
    userId: number,
    id: string,
    clientDeletedAt?: number,
  ): Promise<void> {
    const existing = await this.repo.findSeries(id);
    if (!existing) throw new NotFoundException(`Series "${id}" not found.`);
    this.ensureOwnership(existing.userId, userId, `Series "${id}"`);
    if (existing.deletedAt != null) return;
    await this.repo.deleteSeries(id, userId, clientDeletedAt ?? Date.now());
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

    // `deleted` is what lets a client tell a row it never had from one it is
    // meant to drop. Without it, absence means both, and the client guesses
    // "push it back" — which is how a delete on one device undid itself.
    return { sessions, matches, series, presets, deleted: raw.deleted };
  }
}
