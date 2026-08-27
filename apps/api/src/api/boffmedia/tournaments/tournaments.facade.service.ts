import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TournamentsService } from './services/tournaments.service';
import { RegistrationService } from './services/registration.service';
import { BracketService } from './services/bracket.service';
import { MatchesService } from './services/matches.service';
import { StandingsService } from './services/standings.service';
import { PhasesService } from './services/phases.service';
import { AdvancementService } from './services/advancement.service';
import { EntryService } from './services/entry.service';
import { MatchReportService } from './services/match-report.service';
import { TournamentNotificationsService } from './services/tournament-notifications.service';
import { TournamentAnnouncerService } from './services/tournament-announcer.service';
import { TournamentsRepository } from './repositories/tournaments.repository';
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
import { ProposeReportDto } from './dto/propose-report.dto';
import { ConfirmReportDto } from './dto/confirm-report.dto';
import { TeamsheetDto } from './dto/teamsheet.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { ScheduleMatchesDto } from './dto/schedule-matches.dto';
import { TournamentSummary } from './entities/tournament.entity';
import { TournamentDetail } from './entities/tournament-detail.entity';
import { Competitor } from './entities/competitor.entity';
import { MatchDetail } from './entities/match-detail.entity';
import { MatchMessageView } from './entities/match-message.entity';

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
    private readonly matchReport: MatchReportService,
    private readonly notify: TournamentNotificationsService,
    private readonly announcer: TournamentAnnouncerService,
    private readonly repo: TournamentsRepository,
    private readonly entry: EntryService,
  ) {}

  list(query: ListTournamentsQueryDto): Promise<TournamentSummary[]> {
    return this.tournaments.list(query);
  }

  mine(userId: number) {
    return this.tournaments.mine(userId);
  }

  async getBySlug(
    slug: string,
    userId?: number,
    isAdmin = false,
  ): Promise<TournamentDetail> {
    const row = await this.tournaments.getMetaBySlug(slug);
    const detail = await this.standings.buildDetail(row, userId);
    // A tournament composed into a private event inherits its privacy — that
    // inheritance is the whole reason to attach one, since tournaments have no
    // visibility of their own. Not-found rather than forbidden, matching how
    // the events module hides a private event's sub-resources.
    if (
      detail.event?.visibility === 'private' &&
      !isAdmin &&
      !detail.event.viewerIsMember
    ) {
      throw new NotFoundException('Tournament not found');
    }
    return detail;
  }

  // ── entry flow (Limitless-style) ──────────────────────────────────────────
  /** Admin preview: how the field splits right now, changing nothing. */
  entryPreview(id: number) {
    return this.entry.preview(id);
  }

  /** Admin: put a dropped entrant back in, while no bracket exists yet. */
  readmit(id: number, pid: number): Promise<{ success: boolean }> {
    return this.entry.readmit(id, pid);
  }

  /** Admin: resolve the field now, without generating the bracket. */
  resolveEntries(id: number) {
    return this.entry.resolve(id);
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
    await this.matchReport.settleExpiredProposals(id);
    const res = await this.advancement.advance(id);
    const t = await this.tournaments.getById(id);
    if (res.completed && res.championParticipantId != null) {
      await this.notify.notifyChampion(t, res.championParticipantId);
      await this.announcer.announceChampion(t, res.championParticipantId);
    } else if (!res.completed) {
      await this.notify.notifyPhaseOutcome(
        t,
        res.qualifiedParticipantIds,
        res.eliminatedParticipantIds,
        res.nextPhaseId,
      );
      await this.notifyCurrentRoundReady(id);
    }
    return this.detail(id);
  }

  async update(
    id: number,
    dto: UpdateTournamentDto,
  ): Promise<TournamentDetail> {
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

  setCheckIn(id: number, userId: number, checkedIn: boolean) {
    return this.registration.setCheckIn(id, userId, checkedIn);
  }

  submitScore(
    id: number,
    userId: number,
    dto: SubmitScoreDto,
  ): Promise<Competitor> {
    return this.registration.submitScore(id, userId, dto.score, dto.meta);
  }

  updateParticipant(
    tournamentId: number,
    pid: number,
    dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    return this.registration.updateParticipant(tournamentId, pid, dto);
  }

  removeParticipant(
    tournamentId: number,
    pid: number,
  ): Promise<{ success: boolean }> {
    return this.registration.removeParticipant(tournamentId, pid);
  }

  async generate(
    id: number,
    dto: GenerateBracketDto,
  ): Promise<TournamentDetail> {
    await this.matchReport.settleExpiredProposals(id);
    const t = await this.tournaments.getById(id);
    const wasLive = t.status === 'live';
    await this.bracket.generate(t, dto);
    // Only announce the start on the first NON-PREVIEW generate (the
    // draft/registration → live transition) — swiss calls generate per round.
    if (!wasLive && !dto.preview) {
      await this.notify.notifyStart(t);
      await this.announcer.announceStart(t);
    }
    if (!dto.preview) await this.notifyCurrentRoundReady(id);
    return this.detail(id);
  }

  async report(
    id: number,
    matchId: number,
    dto: ReportMatchDto,
    actorUserId?: number | null,
  ): Promise<TournamentDetail> {
    const before = await this.tournaments.getById(id);
    await this.matches.report(id, matchId, dto, actorUserId);
    const t = await this.tournaments.getById(id);
    if (
      t.status === 'completed' &&
      before.status !== 'completed' &&
      t.championParticipantId != null
    ) {
      await this.notify.notifyChampion(t, t.championParticipantId);
      await this.announcer.announceChampion(t, t.championParticipantId);
    }
    return this.detail(id);
  }

  async setStatus(id: number, dto: SetStatusDto): Promise<TournamentDetail> {
    const before = await this.tournaments.getById(id);
    await this.tournaments.setStatus(id, dto.status);
    if (dto.status === 'registration' && before.status !== 'registration') {
      await this.announcer.announceRegistrationOpen(before);
    }
    return this.detail(id);
  }

  // ── self-report + match page ──────────────────────────────────────────────────
  getMatchDetail(
    slug: string,
    matchId: number,
    userId?: number,
    isAdmin = false,
  ): Promise<MatchDetail> {
    return this.matchReport.getMatchDetail(slug, matchId, userId, isAdmin);
  }

  async proposeReport(
    id: number,
    matchId: number,
    userId: number,
    dto: ProposeReportDto,
  ): Promise<{ success: boolean }> {
    return this.matchReport.propose(id, matchId, userId, dto);
  }

  async confirmReport(
    id: number,
    matchId: number,
    userId: number,
    dto: ConfirmReportDto,
  ): Promise<{ success: boolean }> {
    return this.matchReport.confirm(id, matchId, userId, dto);
  }

  listMatchMessages(
    id: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
    afterId: number,
  ): Promise<MatchMessageView[]> {
    return this.matchReport.listMessages(id, matchId, userId, isAdmin, afterId);
  }

  postMatchMessage(
    id: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
    body: string,
  ): Promise<MatchMessageView> {
    return this.matchReport.postMessage(id, matchId, userId, isAdmin, body);
  }

  requestJudge(
    id: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<{ success: boolean }> {
    return this.matchReport.requestJudge(id, matchId, userId, isAdmin);
  }

  setTeamsheet(
    id: number,
    userId: number,
    dto: TeamsheetDto,
  ): Promise<{ success: boolean }> {
    return this.matchReport.setTeamsheet(id, userId, dto);
  }

  // ── scheduling (admin) ────────────────────────────────────────────────────────
  async scheduleMatches(
    id: number,
    dto: ScheduleMatchesDto,
  ): Promise<TournamentDetail> {
    const all = await this.repo.listMatches(id);
    const own = new Set(all.map((m) => m.id));
    // Unknown ids used to be skipped silently, so scheduling a match from the
    // wrong tournament (a stale admin tab) returned 200 and changed nothing.
    const foreign = dto.matchIds.filter((mid) => !own.has(mid));
    if (foreign.length > 0) {
      throw new BadRequestException(
        `These matches do not belong to this tournament: ${foreign.join(', ')}`,
      );
    }
    for (const mid of dto.matchIds) {
      await this.repo.updateMatch(mid, {
        scheduledAt: dto.scheduledAt ?? null,
      });
    }
    return this.detail(id);
  }

  private async detail(id: number): Promise<TournamentDetail> {
    const row = await this.tournaments.getMetaById(id);
    return this.standings.buildDetail(row);
  }

  /**
   * Notify players of the round that just became playable: ready matches of the
   * lowest open round per bracket. Later-round matches that turn ready via
   * result propagation are notified by MatchesService instead.
   */
  private async notifyCurrentRoundReady(tournamentId: number): Promise<void> {
    try {
      const matches = await this.repo.listMatches(tournamentId);
      const ready = matches.filter((m) => m.status === 'ready');
      const minRound = new Map<string, number>();
      for (const m of ready) {
        minRound.set(
          m.bracket,
          Math.min(minRound.get(m.bracket) ?? Infinity, m.roundNumber),
        );
      }
      for (const m of ready) {
        if (m.roundNumber !== minRound.get(m.bracket)) continue;
        await this.notify.notifyMatchReady(m);
      }
    } catch {
      // best-effort
    }
  }
}
