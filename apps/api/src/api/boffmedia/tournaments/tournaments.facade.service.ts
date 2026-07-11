import { Injectable } from '@nestjs/common';
import { TournamentsService } from './services/tournaments.service';
import { RegistrationService } from './services/registration.service';
import { BracketService } from './services/bracket.service';
import { MatchesService } from './services/matches.service';
import { StandingsService } from './services/standings.service';
import { PhasesService } from './services/phases.service';
import { AdvancementService } from './services/advancement.service';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { Tournament } from '@/_db/schema/Tournaments';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { CreatePhaseDto, UpdatePhaseDto } from './dto/create-phase.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { GenerateBracketDto } from './dto/generate-bracket.dto';
import { ReportMatchDto } from './dto/report-match.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { TournamentSummary } from './entities/tournament.entity';
import { TournamentDetail } from './entities/tournament-detail.entity';
import { Competitor } from './entities/competitor.entity';

@Injectable()
export class TournamentsFacadeService {
  constructor(
    private readonly tournaments: TournamentsService,
    private readonly registration: RegistrationService,
    private readonly bracket: BracketService,
    private readonly matches: MatchesService,
    private readonly standings: StandingsService,
    private readonly phases: PhasesService,
    private readonly advancement: AdvancementService,
    private readonly repo: TournamentsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  list(query: ListTournamentsQueryDto): Promise<TournamentSummary[]> {
    return this.tournaments.list(query);
  }

  async getBySlug(slug: string): Promise<TournamentDetail> {
    const row = await this.tournaments.getMetaBySlug(slug);
    return this.standings.buildDetail(row);
  }

  async getParticipants(slug: string): Promise<Competitor[]> {
    const detail = await this.getBySlug(slug);
    return detail.participants;
  }

  async getMatches(slug: string) {
    const t = await this.tournaments.getMetaBySlug(slug);
    return this.standings.listMatchViews(t.id);
  }

  async create(dto: CreateTournamentDto): Promise<TournamentDetail> {
    const t = await this.tournaments.create(dto);
    await this.phases.createInitialPhases(t, dto.phases);
    return this.detail(t.id);
  }

  // ── phases (admin) ────────────────────────────────────────────────────────────
  async addPhase(id: number, dto: CreatePhaseDto): Promise<TournamentDetail> {
    await this.phases.appendPhase(id, dto);
    return this.detail(id);
  }

  async updatePhase(
    id: number,
    phaseId: number,
    dto: UpdatePhaseDto,
  ): Promise<TournamentDetail> {
    await this.phases.updatePhase(phaseId, dto);
    return this.detail(id);
  }

  async removePhase(id: number, phaseId: number): Promise<TournamentDetail> {
    await this.phases.deletePhase(phaseId);
    return this.detail(id);
  }

  async advance(id: number): Promise<TournamentDetail> {
    const res = await this.advancement.advance(id);
    if (res.completed && res.championParticipantId != null) {
      const t = await this.tournaments.getById(id);
      await this.notifyChampion(t, res.championParticipantId);
    }
    return this.detail(id);
  }

  async update(id: number, dto: UpdateTournamentDto): Promise<TournamentDetail> {
    await this.tournaments.update(id, dto);
    return this.detail(id);
  }

  remove(id: number): Promise<{ success: boolean }> {
    return this.tournaments.remove(id);
  }

  addParticipant(id: number, dto: AddParticipantDto): Promise<Competitor> {
    return this.registration.addParticipant(id, dto);
  }

  register(
    id: number,
    userId: number,
    dto: RegisterParticipantDto,
  ): Promise<Competitor> {
    return this.registration.register(id, userId, dto);
  }

  withdraw(id: number, userId: number): Promise<{ success: boolean }> {
    return this.registration.withdraw(id, userId);
  }

  updateParticipant(
    pid: number,
    dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    return this.registration.updateParticipant(pid, dto);
  }

  removeParticipant(pid: number): Promise<{ success: boolean }> {
    return this.registration.removeParticipant(pid);
  }

  async generate(
    id: number,
    dto: GenerateBracketDto,
  ): Promise<TournamentDetail> {
    const t = await this.tournaments.getById(id);
    const wasLive = t.status === 'live';
    await this.bracket.generate(t, dto);
    // Only announce the start on the first generate (the draft/registration →
    // live transition) — swiss calls generate once per round.
    if (!wasLive) await this.notifyStart(t);
    return this.detail(id);
  }

  async report(
    id: number,
    matchId: number,
    dto: ReportMatchDto,
  ): Promise<TournamentDetail> {
    await this.matches.report(id, matchId, dto);
    const t = await this.tournaments.getById(id);
    if (t.status === 'completed' && t.championParticipantId != null) {
      await this.notifyChampion(t, t.championParticipantId);
    }
    return this.detail(id);
  }

  async setStatus(id: number, dto: SetStatusDto): Promise<TournamentDetail> {
    await this.tournaments.setStatus(id, dto.status);
    return this.detail(id);
  }

  private async detail(id: number): Promise<TournamentDetail> {
    const row = await this.tournaments.getMetaById(id);
    return this.standings.buildDetail(row);
  }

  // ── notification producers (best-effort — never fail the action) ─────────────
  private async notifyStart(t: Tournament): Promise<void> {
    try {
      const parts = await this.repo.listParticipants(t.id);
      const link = `/torneos/${t.slug}`;
      for (const p of parts) {
        if (p.userId == null) continue;
        await this.notifications.create({
          userId: p.userId,
          type: 'tournament',
          title: 'El torneo ha comenzado',
          body: t.name,
          link,
        });
      }
    } catch {
      // swallow — notifications are best-effort
    }
  }

  private async notifyChampion(
    t: Tournament,
    championParticipantId: number,
  ): Promise<void> {
    try {
      const champ = await this.repo.findParticipant(championParticipantId);
      if (champ?.userId != null) {
        await this.notifications.create({
          userId: champ.userId,
          type: 'tournament',
          title: '¡Has ganado el torneo!',
          body: t.name,
          link: `/torneos/${t.slug}`,
        });
      }
    } catch {
      // swallow — notifications are best-effort
    }
  }
}
