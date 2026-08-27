import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { MatchesService } from './matches.service';
import { TournamentNotificationsService } from './tournament-notifications.service';
import {
  Tournament,
  TournamentMatch,
  TournamentParticipant,
} from '@/_db/schema/BoffMediaTournaments';
import {
  effectiveBestOf,
  flipGames,
  gamesToScores,
  validGamesString,
} from '../match-report.util';
import { computeStandings, matchesForPhaseChain } from '../standings.util';
import type { TiebreakProfile } from '../tournaments.types';
import { toCompetitor } from '../tournaments.mapper';
import { ProposeReportDto } from '../dto/propose-report.dto';
import { ConfirmReportDto } from '../dto/confirm-report.dto';
import { TeamsheetDto, TeamsheetMonDto } from '../dto/teamsheet.dto';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import {
  MatchDetail,
  MatchProposalView,
  MatchSideRecord,
} from '../entities/match-detail.entity';
import { MatchMessageView } from '../entities/match-message.entity';

// Fallback window when a tournament doesn't set its own `autoVerifyMinutes`.
const DEFAULT_AUTO_VERIFY_MINUTES = 10;

/**
 * How long an unchanged tournament's standings are reused. Short on purpose:
 * a new result changes the cache key anyway, so this only bounds the window in
 * which two identical polls both recompute.
 */
const STANDINGS_TTL_MS = 5_000;

type ViewerRole = 'top' | 'bot' | 'spectator' | 'admin';

@Injectable()
export class MatchReportService {
  /** Shared across instances on purpose: one cache per process, not per request. */
  private static readonly standingsCache = new Map<
    string,
    { rows: ReturnType<typeof computeStandings>; expires: number }
  >();

  constructor(
    private readonly repo: TournamentsRepository,
    private readonly matches: MatchesService,
    private readonly notify: TournamentNotificationsService,
  ) {}

  // ── match page payload ────────────────────────────────────────────────────
  async getMatchDetail(
    slug: string,
    matchId: number,
    userId?: number,
    isAdmin = false,
  ): Promise<MatchDetail> {
    const t = await this.repo.findBySlug(slug);
    if (!t) throw new NotFoundException('Tournament not found');
    let match = await this.mustFindMatch(t.id, matchId);

    // Lazy auto-verify for THIS match (atomic claim — safe under concurrency).
    if (await this.settleExpiredForMatch(t, match)) {
      match = await this.mustFindMatch(t.id, matchId);
    }

    const participants = await this.repo.listParticipants(t.id);
    const cmap = new Map(participants.map((p) => [p.id, toCompetitor(p)]));
    const viewer =
      userId != null
        ? (participants.find((p) => p.userId === userId) ?? null)
        : null;
    const role = this.roleOf(match, viewer, isAdmin);

    const phases = await this.repo.listPhases(t.id);
    const phase =
      match.phaseId != null
        ? (phases.find((p) => p.id === match.phaseId) ?? null)
        : null;
    const allMatches = await this.repo.listMatches(t.id);
    const chain = phase
      ? matchesForPhaseChain(phase.id, phases, allMatches)
      : allMatches;
    const rows = this.cachedStandings(
      t.id,
      phase?.id ?? null,
      participants.map((p) => p.id),
      chain,
      phase?.tiebreakProfile ?? 'points',
    );
    const recordOf = (pid: number | null): MatchSideRecord | null => {
      if (pid == null) return null;
      const r = rows.find((x) => x.participantId === pid);
      return r ? { w: r.w, d: r.d, l: r.l, pts: r.pts } : null;
    };

    const maxWinnersRound = Math.max(
      0,
      ...allMatches
        .filter((m) => m.phaseId === match.phaseId && m.bracket === 'winners')
        .map((m) => m.roundNumber),
    );
    const bestOf = effectiveBestOf(match, phase, t.bestOf, maxWinnersRound);

    // Opponent's open teamsheet — participants of this match only.
    let opponentTeamsheet: TeamsheetMonDto[] | null = null;
    if (role === 'top' || role === 'bot') {
      const oppId =
        role === 'top' ? match.botParticipantId : match.topParticipantId;
      const opp = participants.find((p) => p.id === oppId);
      opponentTeamsheet = this.parseTeamsheet(opp);
    }

    return {
      id: match.id,
      bracket: match.bracket,
      roundNumber: match.roundNumber,
      position: match.position,
      top:
        match.topParticipantId != null
          ? (cmap.get(match.topParticipantId) ?? null)
          : null,
      bot:
        match.botParticipantId != null
          ? (cmap.get(match.botParticipantId) ?? null)
          : null,
      g1: match.topScore,
      g2: match.botScore,
      status: match.status,
      winner:
        match.winnerParticipantId != null
          ? (cmap.get(match.winnerParticipantId) ?? null)
          : null,
      bestOf,
      scheduledAt: match.scheduledAt ? match.scheduledAt.toISOString() : null,
      proposalState: match.proposalState,
      tournamentId: t.id,
      slug: t.slug,
      tournamentName: t.name,
      phaseName: phase?.name ?? null,
      viewerRole: role,
      topRecord: recordOf(match.topParticipantId),
      botRecord: recordOf(match.botParticipantId),
      proposal: this.proposalView(match, role, viewer),
      judgeRequestedAt: match.judgeRequestedAt
        ? match.judgeRequestedAt.toISOString()
        : null,
      opponentTeamsheet,
      champion:
        t.championParticipantId != null
          ? (cmap.get(t.championParticipantId) ?? null)
          : null,
    };
  }

  /**
   * Standings for the match page, memoised for a few seconds.
   *
   * The match page loads every participant, phase and match of the tournament
   * and recomputes full standings just to show two W-L records — and every
   * viewer polls it. The cache key includes the number of settled matches and
   * the latest `reportedAt`, so any new result invalidates it immediately;
   * the TTL only bounds how long an unchanged tournament is recomputed for.
   */
  private cachedStandings(
    tournamentId: number,
    phaseId: number | null,
    participantIds: number[],
    chain: TournamentMatch[],
    tiebreak: TiebreakProfile,
  ): ReturnType<typeof computeStandings> {
    let settled = 0;
    let latest = 0;
    for (const m of chain) {
      if (m.status !== 'completed' && m.status !== 'bye') continue;
      settled++;
      const at = m.reportedAt ? m.reportedAt.getTime() : 0;
      if (at > latest) latest = at;
    }
    const key = `${tournamentId}:${phaseId ?? 'none'}:${tiebreak}:${participantIds.length}:${settled}:${latest}`;
    const now = Date.now();
    const hit = MatchReportService.standingsCache.get(key);
    if (hit && hit.expires > now) return hit.rows;

    const rows = computeStandings(participantIds, chain, tiebreak);
    // Bounded: a busy server must not accumulate one entry per tournament per
    // result forever. Cheapest correct eviction — drop everything expired.
    if (MatchReportService.standingsCache.size > 256) {
      for (const [k, v] of MatchReportService.standingsCache) {
        if (v.expires <= now) MatchReportService.standingsCache.delete(k);
      }
    }
    MatchReportService.standingsCache.set(key, {
      rows,
      expires: now + STANDINGS_TTL_MS,
    });
    return rows;
  }

  // ── proposals ─────────────────────────────────────────────────────────────
  async propose(
    tournamentId: number,
    matchId: number,
    userId: number,
    dto: ProposeReportDto,
  ): Promise<{ success: boolean }> {
    const t = await this.mustFindTournament(tournamentId);
    let match = await this.mustFindMatch(tournamentId, matchId);
    if (await this.settleExpiredForMatch(t, match)) {
      match = await this.mustFindMatch(tournamentId, matchId);
    }
    const me = await this.mustBeMatchPlayer(tournamentId, matchId, userId);

    if (match.status !== 'ready' && match.status !== 'live') {
      throw new BadRequestException('Match is not open for reporting');
    }
    const phase =
      match.phaseId != null ? await this.repo.findPhase(match.phaseId) : null;
    if (phase && phase.status !== 'live') {
      throw new BadRequestException('Phase is not live');
    }

    const bestOf = await this.matches.matchBestOf(match);
    if (!validGamesString(dto.games, bestOf)) {
      throw new BadRequestException(
        `Invalid result for a best-of-${bestOf} match`,
      );
    }

    const meIsTop = me.id === match.topParticipantId;
    const topGames = meIsTop ? dto.games : flipGames(dto.games);
    const { wins, losses } = gamesToScores(topGames);
    const now = new Date();
    const minutes = t.autoVerifyMinutes ?? DEFAULT_AUTO_VERIFY_MINUTES;
    const claimed = await this.repo.claimProposal(matchId, {
      proposedByParticipantId: me.id,
      proposedTopScore: wins,
      proposedBotScore: losses,
      proposedGames: topGames,
      proposedAt: now,
      proposalExpiresAt: new Date(now.getTime() + minutes * 60_000),
    });
    if (!claimed) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_PROPOSAL_ALREADY_EXISTS,
          'A proposal is already pending on this match',
        ),
      );
    }

    const myScores = gamesToScores(dto.games);
    await this.sysMessage(
      matchId,
      `${me.name} ha reportado ${myScores.wins}-${myScores.losses} a su favor`,
    );
    const rivalId = meIsTop ? match.botParticipantId : match.topParticipantId;
    if (rivalId != null) await this.notify.notifyProposal(match, rivalId);
    return { success: true };
  }

  async confirm(
    tournamentId: number,
    matchId: number,
    userId: number,
    dto: ConfirmReportDto,
  ): Promise<{ success: boolean }> {
    const t = await this.mustFindTournament(tournamentId);
    const match = await this.mustFindMatch(tournamentId, matchId);
    if (await this.settleExpiredForMatch(t, match)) {
      // Auto-verify beat the rival to it — confirming the same result is moot.
      if (dto.accept) return { success: true };
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_PROPOSAL_AUTO_VERIFIED,
          'The proposal was auto-verified by the expiry sweep',
        ),
      );
    }
    const me = await this.mustBeMatchPlayer(tournamentId, matchId, userId);

    if (match.status === 'completed' || match.status === 'bye') {
      throw new BadRequestException('Match already resolved');
    }
    if (
      match.proposalState !== 'pending' ||
      match.proposedByParticipantId == null
    ) {
      throw new BadRequestException('No pending proposal on this match');
    }
    if (match.proposedByParticipantId === me.id) {
      throw new BadRequestException('The rival must verify, not the proposer');
    }
    // An upstream amend may have swapped a slot since the proposal was made.
    if (
      match.proposedByParticipantId !== match.topParticipantId &&
      match.proposedByParticipantId !== match.botParticipantId
    ) {
      await this.clearProposal(matchId);
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_PROPOSAL_INVALIDATED,
          'The proposal is no longer valid due to a match amendment',
        ),
      );
    }

    if (!dto.accept) {
      // Conditional: an admin report or an expiry sweep may have settled the
      // match between the reads above and this write.
      const disputed = await this.repo.claimDispute(
        matchId,
        match.proposedByParticipantId,
        new Date(),
      );
      if (!disputed) {
        throw new BadRequestException(
          userError(
            ApiErrorCode.TOURNAMENT_PROPOSAL_SETTLED_CONCURRENTLY,
            'The proposal was settled while you were disputing it',
          ),
        );
      }
      await this.sysMessage(
        matchId,
        `${me.name} ha disputado el resultado — un juez lo revisará`,
      );
      return { success: true };
    }

    await this.finalizeProposal(t, match);
    await this.sysMessage(
      matchId,
      `Resultado verificado ${match.proposedTopScore}-${match.proposedBotScore} (confirmado por ambos jugadores)`,
    );
    return { success: true };
  }

  /**
   * Lazy auto-verification sweep: settle every expired pending proposal of the
   * tournament. Called from generate/advance so stale proposals never block a
   * round gate. Atomic per-match claims make concurrent sweeps safe.
   */
  async settleExpiredProposals(tournamentId: number): Promise<void> {
    const now = new Date();
    const expired = await this.repo.listExpiredProposalMatches(
      tournamentId,
      now,
    );
    if (expired.length === 0) return;
    const t = await this.repo.findById(tournamentId);
    if (!t) return;
    for (const match of expired) {
      if (!(await this.repo.claimExpiredProposal(match.id, now))) continue;
      await this.finalizeClaimed(t, match);
    }
  }

  /** Single-match variant used by the match page + propose/confirm. */
  private async settleExpiredForMatch(
    t: Tournament | { id: number },
    match: TournamentMatch,
  ): Promise<boolean> {
    const now = new Date();
    if (
      match.proposalState !== 'pending' ||
      match.proposalExpiresAt == null ||
      match.proposalExpiresAt >= now ||
      (match.status !== 'ready' && match.status !== 'live')
    ) {
      return false;
    }
    if (!(await this.repo.claimExpiredProposal(match.id, now))) return false;
    const full = await this.repo.findById(t.id);
    if (full) await this.finalizeClaimed(full, match);
    return true;
  }

  private async finalizeClaimed(
    t: Tournament,
    match: TournamentMatch,
  ): Promise<void> {
    // Proposal invalidated by a slot swap or missing scores → just drop it.
    if (
      match.proposedTopScore == null ||
      match.proposedBotScore == null ||
      (match.proposedByParticipantId !== match.topParticipantId &&
        match.proposedByParticipantId !== match.botParticipantId)
    ) {
      await this.clearProposal(match.id);
      return;
    }
    try {
      await this.finalizeProposal(t, match);
      await this.sysMessage(
        match.id,
        `Resultado auto-verificado ${match.proposedTopScore}-${match.proposedBotScore} (sin respuesta a tiempo)`,
      );
    } catch {
      // e.g. resolved concurrently by an admin — the proposal is already gone.
    }
  }

  /** Settle a match from its (validated) proposal + champion notification. */
  private async finalizeProposal(
    t: Tournament,
    match: TournamentMatch,
  ): Promise<void> {
    await this.matches.report(t.id, match.id, {
      topScore: match.proposedTopScore!,
      botScore: match.proposedBotScore!,
    });
    const after = await this.repo.findById(t.id);
    if (
      after?.status === 'completed' &&
      after.championParticipantId != null &&
      t.status !== 'completed'
    ) {
      await this.notify.notifyChampion(after, after.championParticipantId);
    }
  }

  private async clearProposal(matchId: number): Promise<void> {
    await this.repo.updateMatch(matchId, {
      proposedByParticipantId: null,
      proposedTopScore: null,
      proposedBotScore: null,
      proposedGames: null,
      proposedAt: null,
      proposalExpiresAt: null,
      proposalState: null,
    });
  }

  // ── chat ──────────────────────────────────────────────────────────────────
  async listMessages(
    tournamentId: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
    afterId = 0,
  ): Promise<MatchMessageView[]> {
    await this.mustFindMatch(tournamentId, matchId);
    await this.assertChatAccess(tournamentId, matchId, userId, isAdmin);
    const rows = await this.repo.listMatchMessages(matchId, afterId);
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      authorUserId: r.authorUserId,
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async postMessage(
    tournamentId: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
    body: string,
  ): Promise<MatchMessageView> {
    await this.mustFindMatch(tournamentId, matchId);
    const me = await this.assertChatAccess(
      tournamentId,
      matchId,
      userId,
      isAdmin,
    );
    const kind = me == null ? 'judge' : 'player'; // admin without a seat = judge
    const authorName =
      me?.name ?? (await this.repo.findUserBasic(userId))?.username ?? 'Juez';
    const id = await this.repo.addMatchMessage({
      matchId,
      authorUserId: userId,
      authorName,
      kind,
      body,
    });
    return {
      id,
      kind,
      authorUserId: userId,
      authorName,
      body,
      createdAt: new Date().toISOString(),
    };
  }

  async requestJudge(
    tournamentId: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<{ success: boolean }> {
    const match = await this.mustFindMatch(tournamentId, matchId);
    const me = await this.assertChatAccess(
      tournamentId,
      matchId,
      userId,
      isAdmin,
    );
    if (match.judgeRequestedAt == null) {
      await this.repo.updateMatch(matchId, { judgeRequestedAt: new Date() });
    }
    await this.sysMessage(
      matchId,
      `${me?.name ?? 'Un juez'} ha solicitado un juez para esta mesa`,
    );
    return { success: true };
  }

  // ── teamsheet ─────────────────────────────────────────────────────────────
  async setTeamsheet(
    tournamentId: number,
    userId: number,
    dto: TeamsheetDto,
  ): Promise<{ success: boolean }> {
    const t = await this.mustFindTournament(tournamentId);
    // Open-teamsheet format: the opponent is shown this list on the match page,
    // so it must be frozen once the field is resolved. Editing afterwards would
    // let a player show one team and bring another.
    if (t.teamsheetLockedAt != null) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_TEAMSHEET_LOCKED,
          'Teamsheets are locked for this tournament',
        ),
      );
    }
    if (t.status === 'live' || t.status === 'completed') {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_TEAMSHEET_LOCKED,
          'Teamsheets are locked once the tournament starts',
        ),
      );
    }
    const me = await this.repo.findParticipantByUser(tournamentId, userId);
    if (!me) throw new NotFoundException('Not registered in this tournament');
    await this.repo.updateParticipant(me.id, {
      teamsheet: dto.mons.length ? JSON.stringify(dto.mons) : null,
    });
    return { success: true };
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  private roleOf(
    match: TournamentMatch,
    viewer: TournamentParticipant | null,
    isAdmin: boolean,
  ): ViewerRole {
    if (viewer && viewer.id === match.topParticipantId) return 'top';
    if (viewer && viewer.id === match.botParticipantId) return 'bot';
    return isAdmin ? 'admin' : 'spectator';
  }

  private proposalView(
    match: TournamentMatch,
    role: ViewerRole,
    viewer: TournamentParticipant | null,
  ): MatchProposalView | null {
    if (
      match.proposalState == null ||
      match.proposedByParticipantId == null ||
      match.proposedGames == null
    ) {
      return null;
    }
    // An unconfirmed proposal is not a result yet: only the two players and a
    // judge may read it. The match page is @OptionalAuth, so without this a
    // spectator (or the winner's next-round rival) learns the games and score
    // before the opponent has verified them.
    if (role === 'spectator') return null;
    return {
      byParticipantId: String(match.proposedByParticipantId),
      mine: viewer != null && viewer.id === match.proposedByParticipantId,
      games:
        role === 'bot' ? flipGames(match.proposedGames) : match.proposedGames,
      topScore: match.proposedTopScore ?? 0,
      botScore: match.proposedBotScore ?? 0,
      state: match.proposalState,
      expiresAt: (match.proposalExpiresAt ?? new Date()).toISOString(),
    };
  }

  private parseTeamsheet(
    p: TournamentParticipant | undefined,
  ): TeamsheetMonDto[] | null {
    if (!p?.teamsheet) return null;
    try {
      const mons = JSON.parse(p.teamsheet) as TeamsheetMonDto[];
      return Array.isArray(mons) && mons.length ? mons : null;
    } catch {
      return null;
    }
  }

  private async sysMessage(matchId: number, body: string): Promise<void> {
    try {
      await this.repo.addMatchMessage({ matchId, kind: 'sys', body });
    } catch {
      // chat is best-effort
    }
  }

  /** The caller's own participant, required to be one of the match's two seats. */
  private async mustBeMatchPlayer(
    tournamentId: number,
    matchId: number,
    userId: number,
  ): Promise<TournamentParticipant> {
    const me = await this.repo.findParticipantByUser(tournamentId, userId);
    const match = await this.mustFindMatch(tournamentId, matchId);
    if (
      !me ||
      (me.id !== match.topParticipantId && me.id !== match.botParticipantId)
    ) {
      throw new ForbiddenException('You are not a player of this match');
    }
    return me;
  }

  /** Chat access: one of the two players (returned) or an admin (null). */
  private async assertChatAccess(
    tournamentId: number,
    matchId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<TournamentParticipant | null> {
    const me = await this.repo.findParticipantByUser(tournamentId, userId);
    const match = await this.mustFindMatch(tournamentId, matchId);
    const isPlayer =
      me != null &&
      (me.id === match.topParticipantId || me.id === match.botParticipantId);
    if (isPlayer) return me;
    if (isAdmin) return null;
    throw new ForbiddenException('Chat is restricted to the two players');
  }

  private async mustFindTournament(id: number): Promise<Tournament> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  private async mustFindMatch(
    tournamentId: number,
    matchId: number,
  ): Promise<TournamentMatch> {
    const match = await this.repo.findMatch(matchId);
    if (!match || match.tournamentId !== tournamentId) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }
}
