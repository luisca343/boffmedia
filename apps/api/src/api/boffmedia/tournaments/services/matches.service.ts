import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { TournamentMatch } from '@/_db/schema/BoffMediaTournaments';
import { ReportMatchDto } from '../dto/report-match.dto';
import { effectiveBestOf } from '../match-report.util';
import { TournamentNotificationsService } from './tournament-notifications.service';
import type { MatchStatus } from '../tournaments.types';

const ELIMINATION: ReadonlySet<string> = new Set([
  'winners',
  'losers',
  'grand',
  'third',
]);

export interface Settlement {
  winnerId: number | null;
  loserId: number | null;
  topScore: number | null;
  botScore: number | null;
  status: MatchStatus;
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly repo: TournamentsRepository,
    private readonly notify: TournamentNotificationsService,
  ) {}

  /** Admin reports a result; returns the winner id (or null for a draw). */
  async report(
    tournamentId: number,
    matchId: number,
    dto: ReportMatchDto,
  ): Promise<{ success: boolean; winnerParticipantId: number | null }> {
    const match = await this.repo.findMatch(matchId);
    if (!match || match.tournamentId !== tournamentId) {
      throw new NotFoundException('Match not found');
    }
    const alreadyResolved =
      match.status === 'completed' || match.status === 'bye';
    if (alreadyResolved && !dto.amend) {
      throw new BadRequestException(
        'Match already resolved (pass amend:true to correct it)',
      );
    }
    if (match.topParticipantId == null || match.botParticipantId == null) {
      throw new BadRequestException('Match is not ready (both slots required)');
    }
    if (alreadyResolved) await this.assertAmendable(match);

    // Forfeit / walkover: the named winner takes the match by the opponent's
    // absence. No score is entered and best-of bounds don't apply; the bracket
    // still advances the winner exactly as a played result would.
    if (dto.forfeit) {
      if (dto.winnerParticipantId == null) {
        throw new BadRequestException('A forfeit needs an explicit winner');
      }
      if (
        dto.winnerParticipantId !== match.topParticipantId &&
        dto.winnerParticipantId !== match.botParticipantId
      ) {
        throw new BadRequestException(
          'Winner must be one of the two competitors',
        );
      }
      const winnerIsTop = dto.winnerParticipantId === match.topParticipantId;
      await this.settle(match, {
        winnerId: dto.winnerParticipantId,
        loserId: winnerIsTop ? match.botParticipantId : match.topParticipantId,
        topScore: winnerIsTop ? 1 : 0,
        botScore: winnerIsTop ? 0 : 1,
        status: 'completed',
      });
      return { success: true, winnerParticipantId: dto.winnerParticipantId };
    }

    const bestOf = await this.matchBestOf(match);
    this.validateBestOf(bestOf, dto.topScore, dto.botScore);

    let winnerId = dto.winnerParticipantId ?? null;
    if (winnerId == null) {
      if (dto.topScore > dto.botScore) winnerId = match.topParticipantId;
      else if (dto.botScore > dto.topScore) winnerId = match.botParticipantId;
    }
    if (
      winnerId != null &&
      winnerId !== match.topParticipantId &&
      winnerId !== match.botParticipantId
    ) {
      throw new BadRequestException(
        'Winner must be one of the two competitors',
      );
    }
    if (winnerId == null && ELIMINATION.has(match.bracket)) {
      throw new BadRequestException('This match cannot end in a draw');
    }

    const loserId =
      winnerId == null
        ? null
        : winnerId === match.topParticipantId
          ? match.botParticipantId
          : match.topParticipantId;

    await this.settle(match, {
      winnerId,
      loserId,
      topScore: dto.topScore,
      botScore: dto.botScore,
      status: 'completed',
    });

    return { success: true, winnerParticipantId: winnerId };
  }

  /**
   * Persist a match result and propagate it: advance the winner into its
   * `nextMatch` slot, drop the loser into `loserNextMatch` (double-elim), and
   * crown the champion when a bracket final resolves. Reused for bye auto-advance.
   */
  async settle(match: TournamentMatch, s: Settlement): Promise<void> {
    await this.repo.updateMatch(match.id, {
      topScore: s.topScore,
      botScore: s.botScore,
      winnerParticipantId: s.winnerId,
      status: s.status,
      reportedAt: new Date(),
      // Any settlement (rival confirm, admin report/amend, forfeit, bye)
      // supersedes whatever self-report proposal was open on the match.
      proposedByParticipantId: null,
      proposedTopScore: null,
      proposedBotScore: null,
      proposedGames: null,
      proposedAt: null,
      proposalExpiresAt: null,
      proposalState: null,
    });

    if (s.winnerId == null) return; // draw (league/group/swiss) — nothing to advance

    if (match.nextMatchId && match.nextMatchSlot) {
      await this.repo.setMatchSlot(
        match.nextMatchId,
        match.nextMatchSlot,
        s.winnerId,
      );
      await this.markReadyIfComplete(match.nextMatchId);
    }

    if (
      match.loserNextMatchId &&
      match.loserNextMatchSlot &&
      s.loserId != null
    ) {
      await this.repo.setMatchSlot(
        match.loserNextMatchId,
        match.loserNextMatchSlot,
        s.loserId,
      );
      await this.markReadyIfComplete(match.loserNextMatchId);
    }

    // A decisive bracket final (no onward match) crowns the champion the moment
    // it resolves — on the LAST phase only; a mid-sequence elim final waits for
    // `advance`. The phase itself completes once nothing in it is unresolved,
    // so a pending third-place playoff keeps both phase and tournament open.
    // Table-format phases (swiss/roundrobin/leaderboard) have no bracket final —
    // they finalize via the advancement service instead.
    const isDecisiveFinal =
      !match.nextMatchId &&
      (match.bracket === 'winners' || match.bracket === 'grand');

    if (match.phaseId == null) {
      // Legacy phase-less match: original single-shot behavior.
      if (isDecisiveFinal) {
        await this.repo.update(match.tournamentId, {
          championParticipantId: s.winnerId,
          status: 'completed',
        });
      }
      return;
    }

    if (
      isDecisiveFinal &&
      (await this.isFinalPhase(match.tournamentId, match.phaseId))
    ) {
      await this.repo.update(match.tournamentId, {
        championParticipantId: s.winnerId,
      });
    }
    if (isDecisiveFinal || match.bracket === 'third') {
      await this.maybeCompletePhase(match.tournamentId, match.phaseId);
    }
  }

  /** Complete the phase (and tournament, on the last one) once fully resolved. */
  private async maybeCompletePhase(
    tournamentId: number,
    phaseId: number,
  ): Promise<void> {
    const phaseMatches = await this.repo.listMatchesByPhase(phaseId);
    if (
      phaseMatches.some((m) => m.status !== 'completed' && m.status !== 'bye')
    ) {
      return;
    }
    await this.repo.updatePhase(phaseId, { status: 'completed' });
    if (await this.isFinalPhase(tournamentId, phaseId)) {
      await this.repo.update(tournamentId, { status: 'completed' });
    }
  }

  /** Effective best-of for one match (phase finals may escalate, e.g. BO5). */
  async matchBestOf(match: TournamentMatch): Promise<number> {
    const tournament = await this.repo.findById(match.tournamentId);
    const phase =
      match.phaseId != null ? await this.repo.findPhase(match.phaseId) : null;
    if (phase?.finalsBestOf == null) {
      return phase?.bestOf ?? tournament?.bestOf ?? 1;
    }
    const phaseMatches = await this.repo.listMatchesByPhase(phase.id);
    const maxWinnersRound = Math.max(
      0,
      ...phaseMatches
        .filter((m) => m.bracket === 'winners')
        .map((m) => m.roundNumber),
    );
    return effectiveBestOf(
      match,
      phase,
      tournament?.bestOf ?? 1,
      maxWinnersRound,
    );
  }

  /** True for a legacy phase-less match or a match in the highest-order phase. */
  private async isFinalPhase(
    tournamentId: number,
    phaseId: number | null,
  ): Promise<boolean> {
    if (phaseId == null) return true;
    const phases = await this.repo.listPhases(tournamentId);
    if (phases.length === 0) return true;
    const maxOrder = Math.max(...phases.map((p) => p.phaseOrder));
    const phase = phases.find((p) => p.id === phaseId);
    return phase == null || phase.phaseOrder === maxOrder;
  }

  /**
   * A resolved match may only be corrected while nothing downstream has been
   * played: its winner/loser targets must still be open, and (for swiss) no
   * later round may exist — later rounds are paired from these standings.
   */
  private async assertAmendable(match: TournamentMatch): Promise<void> {
    const blocked = async (id: number | null): Promise<boolean> => {
      if (id == null) return false;
      const next = await this.repo.findMatch(id);
      return next?.status === 'completed' || next?.status === 'bye';
    };
    if (
      (await blocked(match.nextMatchId)) ||
      (await blocked(match.loserNextMatchId))
    ) {
      throw new BadRequestException(
        'Cannot amend: a later match has already been played',
      );
    }
    // Once a later phase has been seeded from this phase's standings, the result
    // is frozen — amending it would contradict who advanced. This covers table
    // formats (league/swiss) whose final standings drove `advance`, where there
    // is no downstream match to catch it.
    if (match.phaseId != null) {
      const phases = await this.repo.listPhases(match.tournamentId);
      const phase = phases.find((p) => p.id === match.phaseId);
      if (phase) {
        for (const later of phases.filter(
          (p) => p.phaseOrder > phase.phaseOrder,
        )) {
          const entrants = await this.repo.listPhaseEntrants(later.id);
          if (entrants.length > 0) {
            throw new BadRequestException(
              'Cannot amend: a later phase has already been seeded from these results',
            );
          }
        }
      }
    }
    // Swiss pairs each round from the standings so far, so a played later round
    // in the SAME phase locks this one (Day 1 and Day 2 are separate phases).
    if (match.bracket === 'swiss') {
      const all = await this.repo.listMatches(match.tournamentId);
      const hasLaterRound = all.some(
        (m) =>
          m.bracket === 'swiss' &&
          m.phaseId === match.phaseId &&
          m.roundNumber > match.roundNumber,
      );
      if (hasLaterRound) {
        throw new BadRequestException(
          'Cannot amend: a later swiss round has already been generated',
        );
      }
    }
  }

  /**
   * Games-won bounds for a best-of-N match: the winner needs a majority and the
   * total games can't exceed N. Draws (equal games) are exempt — leagues/swiss
   * allow them and they carry no game-count constraint.
   */
  private validateBestOf(bestOf: number, top: number, bot: number): void {
    if (top === bot) return;
    const majority = Math.ceil(bestOf / 2);
    if (Math.max(top, bot) > majority || top + bot > bestOf) {
      throw new BadRequestException(
        `Invalid score for a best-of-${bestOf} match`,
      );
    }
  }

  private async markReadyIfComplete(matchId: number): Promise<void> {
    const m = await this.repo.findMatch(matchId);
    if (!m) return;
    if (
      m.status === 'pending' &&
      m.topParticipantId != null &&
      m.botParticipantId != null
    ) {
      await this.repo.setMatchStatus(matchId, 'ready');
      await this.notify.notifyMatchReady(m);
    }
  }
}
