import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { BracketService } from './bracket.service';
import {
  computeStandings,
  matchesForPhaseChain,
  standingsForEntrants,
} from '../standings.util';
import { TournamentMatch, TournamentPhase } from '@/_db/schema/BoffMediaTournaments';

interface Ranked {
  participantId: number;
  rank: number;
  w: number;
  l: number;
}

export interface AdvanceResult {
  completed: boolean;
  championParticipantId: number | null;
  nextPhaseId: number | null;
  qualifiedCount: number;
  // Entrants of the phase just closed, split by outcome (for notifications).
  qualifiedParticipantIds: number[];
  eliminatedParticipantIds: number[];
}

/**
 * Closes the live phase and opens the next one: computes the phase's final
 * standings (over its carry chain), applies the advancement rule to pick
 * qualifiers, freezes them as the next phase's seeded entrants, eliminates the
 * rest, and builds the next structure. On the final phase it crowns the champion.
 */
@Injectable()
export class AdvancementService {
  constructor(
    private readonly repo: TournamentsRepository,
    private readonly bracket: BracketService,
  ) {}

  async advance(tournamentId: number): Promise<AdvanceResult> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');

    const phases = await this.repo.listPhases(tournamentId);
    // Elimination phases settle themselves to 'completed' when their final
    // lands, so "the phase to advance" is the live one — or, failing that, the
    // highest completed phase whose successor hasn't been seeded yet.
    let live = phases.find((p) => p.status === 'live');
    if (!live) {
      for (const p of [...phases]
        .filter((x) => x.status === 'completed')
        .sort((a, b) => b.phaseOrder - a.phaseOrder)) {
        const nextP = phases.find((x) => x.phaseOrder === p.phaseOrder + 1);
        if (!nextP) continue;
        if ((await this.repo.listPhaseEntrants(nextP.id)).length === 0) {
          live = p;
          break;
        }
      }
    }
    if (!live) throw new BadRequestException('No live phase to advance');

    const allMatches = await this.repo.listMatches(tournamentId);
    const phaseMatches = allMatches.filter((m) => m.phaseId === live.id);

    // 1. Every match of this phase must be resolved (and all swiss rounds run).
    if (
      phaseMatches.some((m) => m.status !== 'completed' && m.status !== 'bye')
    ) {
      throw new BadRequestException(
        'Finish every match in the current phase first',
      );
    }
    if (live.format === 'swiss' && live.rounds != null) {
      const maxRound = phaseMatches.length
        ? Math.max(...phaseMatches.map((m) => m.roundNumber))
        : 0;
      if (maxRound < live.rounds) {
        throw new BadRequestException(
          `Generate all ${live.rounds} swiss rounds before advancing`,
        );
      }
    }

    // 2. Final standings for this phase, over its entrants + carry chain,
    //    computed against the whole field so records/resistance stay complete.
    const entrants = await this.repo.listPhaseEntrants(live.id);
    const entrantIds = entrants.map((e) => e.participantId);
    const participants = await this.repo.listParticipants(tournamentId);
    const allParticipantIds = participants.map((p) => p.id);
    // Withdrawn / disqualified entrants keep their records for everyone else's
    // resistance math but can neither advance nor be crowned.
    const activeSet = new Set(
      participants.filter((p) => p.status === 'active').map((p) => p.id),
    );
    const standings = (
      await this.finalStandings(
        live,
        entrantIds,
        allParticipantIds,
        matchesForPhaseChain(live.id, phases, allMatches),
      )
    ).filter((s) => activeSet.has(s.participantId));

    const next = phases.find((p) => p.phaseOrder === live.phaseOrder + 1);

    // 3. Final phase → crown the champion (unless an elim final already did) + close.
    if (!next) {
      let champion = t.championParticipantId;
      await this.repo.transaction(async (tx) => {
        if (champion == null && standings.length > 0) {
          champion = standings[0].participantId;
          await tx.update(tournamentId, { championParticipantId: champion });
        }
        await tx.updatePhase(live.id, { status: 'completed' });
        await tx.update(tournamentId, { status: 'completed' });
      });
      return {
        completed: true,
        championParticipantId: champion ?? null,
        nextPhaseId: null,
        qualifiedCount: 0,
        qualifiedParticipantIds: champion != null ? [champion] : [],
        eliminatedParticipantIds: [],
      };
    }

    // 4-5. Apply the rule and require a viable next field. Groups phases pick
    // per group (top N of each, cross-seeded); other formats use the flat rule.
    const qualifiers =
      live.format === 'groups'
        ? await this.groupPhaseQualifiers(live, phaseMatches, activeSet)
        : this.selectQualifiers(live, standings);
    if (qualifiers.length < 2) {
      throw new BadRequestException(
        'Advancement rule yields fewer than 2 qualifiers — adjust results or the rule',
      );
    }
    const qualifierIds = new Set(qualifiers.map((q) => q.participantId));
    // Notify only entrants who were still active but missed the cut (not those
    // who had already withdrawn).
    const eliminatedParticipantIds = entrants
      .map((e) => e.participantId)
      .filter((id) => activeSet.has(id) && !qualifierIds.has(id));

    // 6-7. Freeze qualifiers as next-phase entrants, eliminate the rest, flip phases.
    await this.repo.transaction(async (tx) => {
      await tx.addPhaseEntrants(
        qualifiers.map((q, i) => ({
          phaseId: next.id,
          participantId: q.participantId,
          seed: i + 1,
          sourceRank: q.rank,
          sourceRecord: `${q.w}-${q.l}`,
        })),
      );
      for (const e of entrants) {
        if (!qualifierIds.has(e.participantId)) {
          await tx.updateParticipant(e.participantId, { status: 'eliminated' });
        }
      }
      await tx.updatePhase(live.id, { status: 'completed' });
      await tx.updatePhase(next.id, { status: 'live' });
    });

    // 8. Build the next phase's structure. Idempotent: a crash here is recovered
    // by re-running generate/advance (buildPhase wipes the phase and rebuilds).
    await this.bracket.buildPhase(
      t,
      { ...next, status: 'live' },
      qualifiers.map((q) => q.participantId),
      {},
    );

    return {
      completed: false,
      championParticipantId: null,
      nextPhaseId: next.id,
      qualifiedCount: qualifiers.length,
      qualifiedParticipantIds: qualifiers.map((q) => q.participantId),
      eliminatedParticipantIds,
    };
  }

  /** Ranked table for the phase — score order for leaderboard, else 3-1-0. */
  private async finalStandings(
    phase: TournamentPhase,
    entrantIds: number[],
    allParticipantIds: number[],
    chainMatches: import('@/_db/schema/BoffMediaTournaments').TournamentMatch[],
  ): Promise<Ranked[]> {
    if (phase.format === 'leaderboard') {
      const parts = await this.repo.listParticipants(phase.tournamentId);
      const ranked = parts
        .filter((p) => entrantIds.includes(p.id))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      return ranked.map((p, i) => ({
        participantId: p.id,
        rank: i + 1,
        w: 0,
        l: 0,
      }));
    }
    return standingsForEntrants(
      entrantIds,
      allParticipantIds,
      chainMatches,
      phase.tiebreakProfile,
    ).map((s) => ({
      participantId: s.participantId,
      rank: s.rank,
      w: s.w,
      l: s.l,
    }));
  }

  /**
   * Groups-phase qualifiers: top `group.advanceCount` of each group by the
   * phase's tiebreak, cross-seeded (all group winners first, then runners-up…).
   * Group membership derives from the phase's match rows — `participants.groupId`
   * is transient and may have been rewritten by a later phase.
   */
  private async groupPhaseQualifiers(
    phase: TournamentPhase,
    phaseMatches: TournamentMatch[],
    activeSet: Set<number>,
  ): Promise<Ranked[]> {
    const groups = (await this.repo.listGroups(phase.tournamentId))
      .filter((g) => g.phaseId === phase.id)
      .sort((a, b) => a.order - b.order);
    const perGroup = groups.map((g) => {
      const gMatches = phaseMatches.filter((m) => m.groupId === g.id);
      const memberIds = [
        ...new Set(
          gMatches
            .flatMap((m) => [m.topParticipantId, m.botParticipantId])
            .filter((id): id is number => id != null),
        ),
      ];
      return computeStandings(memberIds, gMatches, phase.tiebreakProfile)
        .filter((r) => activeSet.has(r.participantId))
        .slice(0, g.advanceCount)
        .map((r) => ({
          participantId: r.participantId,
          rank: r.rank,
          w: r.w,
          l: r.l,
        }));
    });
    const out: Ranked[] = [];
    for (let rank = 0; ; rank++) {
      let any = false;
      for (const g of perGroup) {
        if (g[rank]) {
          out.push(g[rank]);
          any = true;
        }
      }
      if (!any) break;
    }
    return out;
  }

  private selectQualifiers(
    phase: TournamentPhase,
    standings: Ranked[],
  ): Ranked[] {
    switch (phase.advanceType) {
      case 'top_n':
        return standings.slice(0, phase.advanceCount ?? standings.length);
      case 'record': {
        const cap = phase.advanceMaxLosses ?? Number.MAX_SAFE_INTEGER;
        const eligible = standings.filter((s) => s.l <= cap);
        return phase.advanceCount != null
          ? eligible.slice(0, phase.advanceCount)
          : eligible;
      }
      case 'top_or_record': {
        // Union: the top N by standings OR anyone at ≤ maxLosses losses.
        // Standings are sorted, so both sets are contiguous from the top — the
        // qualifier count is max(N, #{≤maxLosses}), i.e. an asymmetric cut.
        const n = phase.advanceCount ?? 0;
        const cap = phase.advanceMaxLosses ?? Number.MAX_SAFE_INTEGER;
        return standings.filter((s, i) => i < n || s.l <= cap);
      }
      case 'all':
      default:
        return standings;
    }
  }
}
