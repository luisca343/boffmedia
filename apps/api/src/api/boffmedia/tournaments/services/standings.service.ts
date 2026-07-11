import { Injectable } from '@nestjs/common';
import {
  TournamentsRepository,
  TournamentListRow,
} from '../repositories/tournaments.repository';
import {
  TournamentGroup,
  TournamentMatch,
  TournamentParticipant,
  TournamentPhase,
  TournamentPhaseEntrant,
} from '@/_db/schema/Tournaments';
import {
  computeStandings,
  matchesForPhaseChain,
  standingsForEntrants,
} from '../standings.util';
import { toCompetitor } from '../tournaments.mapper';
import { Competitor } from '../entities/competitor.entity';
import { MatchView } from '../entities/match.entity';
import {
  Standing,
  CrosstableData,
  GroupView,
  LeagueView,
} from '../entities/standings.entity';
import { LbEntry } from '../entities/leaderboard.entity';
import { TournamentDetail } from '../entities/tournament-detail.entity';
import { PhaseView } from '../entities/phase.entity';
import type { PhaseStatus, TournamentFormat } from '../tournaments.types';

@Injectable()
export class StandingsService {
  constructor(private readonly repo: TournamentsRepository) {}

  async buildDetail(t: TournamentListRow): Promise<TournamentDetail> {
    const participants = await this.repo.listParticipants(t.id);
    const teamIds = participants.filter((p) => p.kind === 'team').map((p) => p.id);
    const rosterRows = await this.repo.listRoster(teamIds);
    const rosterByParticipant = new Map<number, typeof rosterRows>();
    for (const r of rosterRows) {
      const arr = rosterByParticipant.get(r.participantId);
      if (arr) arr.push(r);
      else rosterByParticipant.set(r.participantId, [r]);
    }

    const cmap = new Map<number, Competitor>();
    for (const p of participants) {
      cmap.set(p.id, toCompetitor(p, rosterByParticipant.get(p.id)));
    }

    const matches = await this.repo.listMatches(t.id);
    const groups = await this.repo.listGroups(t.id);
    const phases = await this.repo.listPhases(t.id);
    const entrants = await this.repo.listPhaseEntrantsForTournament(t.id);

    const phaseViews = this.buildPhases(
      t,
      phases,
      participants,
      matches,
      cmap,
      groups,
      entrants,
    );
    const activePhaseId = this.pickActivePhaseId(phases);
    // Legacy `view`: the active phase's render model (kept one release).
    const view =
      phaseViews.find((pv) => pv.id === activePhaseId)?.view ??
      phaseViews[0]?.view ??
      this.buildView(t, participants, matches, cmap, groups);

    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      format: t.format,
      competitorKind: t.competitorKind,
      status: t.status,
      metric: t.metric,
      unit: t.unit,
      gameId: t.gameId,
      gameTitle: t.gameTitle,
      eventId: t.eventId,
      description: t.description,
      rules: t.rules,
      banner: t.banner,
      icon: t.icon,
      hue: t.hue,
      bestOf: t.bestOf,
      maxParticipants: t.maxParticipants,
      registrationOpen: t.registrationOpen,
      startDate: t.startDate ? t.startDate.toISOString() : null,
      endDate: t.endDate ? t.endDate.toISOString() : null,
      champion:
        t.championParticipantId != null
          ? cmap.get(t.championParticipantId) ?? null
          : null,
      participants: participants.map((p) => cmap.get(p.id)!),
      activePhaseId,
      phases: phaseViews,
      view,
    };
  }

  // ── phases ──────────────────────────────────────────────────────────────────
  private buildPhases(
    t: TournamentListRow,
    phases: TournamentPhase[],
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
    groups: TournamentGroup[],
    entrants: TournamentPhaseEntrant[],
  ): PhaseView[] {
    // Pre-migration safety net: synthesise a single phase from the tournament.
    if (phases.length === 0) {
      return [
        {
          id: 0,
          order: 1,
          name: 'Fase única',
          format: t.format === 'groups' ? 'roundrobin' : t.format,
          status: this.mapTournamentStatus(t.status),
          rounds: null,
          bestOf: t.bestOf,
          carryStandings: false,
          advance: null,
          entrantCount: participants.length,
          qualifiedCount: null,
          view: this.buildView(t, participants, matches, cmap, groups),
        },
      ];
    }

    const single = phases.length === 1;
    const partById = new Map(participants.map((p) => [p.id, p]));
    const entrantsByPhase = new Map<number, TournamentPhaseEntrant[]>();
    for (const e of entrants) {
      const arr = entrantsByPhase.get(e.phaseId);
      if (arr) arr.push(e);
      else entrantsByPhase.set(e.phaseId, [e]);
    }

    return phases.map((ph, i) => {
      const phEntrants = entrantsByPhase.get(ph.id) ?? [];
      const phMatches = matches.filter((m) => m.phaseId === ph.id);
      // Single-phase tournaments (incl. every backfilled legacy one) render from
      // `tournaments.format` so the `groups` path keeps working; multi-phase ones
      // render each phase from its own format over its own entrants + matches.
      const phParticipants = phEntrants
        .map((e) => partById.get(e.participantId))
        .filter((p): p is TournamentParticipant => p != null);
      const view = single
        ? this.buildView(t, participants, matches, cmap, groups)
        : ph.format === 'swiss'
          ? this.swissPhaseView(ph, phParticipants, phMatches, cmap, {
              phases,
              allMatches: matches,
              allParticipantIds: participants.map((p) => p.id),
            })
          : this.buildFormatView(ph.format, phParticipants, phMatches, cmap, t);
      const next = phases[i + 1];
      const qualifiedCount = next
        ? (entrantsByPhase.get(next.id) ?? []).length
        : null;
      return {
        id: ph.id,
        order: ph.phaseOrder,
        name: ph.name,
        format: ph.format,
        status: ph.status,
        rounds: ph.rounds,
        bestOf: ph.bestOf ?? t.bestOf,
        carryStandings: ph.carryStandings,
        advance: ph.advanceType
          ? {
              type: ph.advanceType,
              maxLosses: ph.advanceMaxLosses,
              count: ph.advanceCount,
            }
          : null,
        entrantCount: phEntrants.length,
        qualifiedCount,
        view,
      };
    });
  }

  /** Default phase tab: the live one, else the last completed, else the first. */
  private pickActivePhaseId(phases: TournamentPhase[]): number | null {
    if (phases.length === 0) return null;
    const live = phases.find((p) => p.status === 'live');
    if (live) return live.id;
    const completed = [...phases]
      .reverse()
      .find((p) => p.status === 'completed');
    if (completed) return completed.id;
    return phases[0].id;
  }

  private mapTournamentStatus(status: string): PhaseStatus {
    if (status === 'live') return 'live';
    if (status === 'completed') return 'completed';
    return 'pending';
  }

  /** Flat match list (all brackets) — for the admin report console. */
  async listMatchViews(tournamentId: number): Promise<MatchView[]> {
    const participants = await this.repo.listParticipants(tournamentId);
    const cmap = new Map<number, Competitor>();
    for (const p of participants) cmap.set(p.id, toCompetitor(p));
    const matches = await this.repo.listMatches(tournamentId);
    return matches.map((m) => this.toMatchView(m, cmap));
  }

  private buildView(
    t: TournamentListRow,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
    groups: TournamentGroup[] = [],
  ): object {
    if (t.format === 'groups') {
      return {
        groups: this.groupsView(participants, matches, cmap, groups),
        knockout: matches.some((m) => m.bracket === 'winners')
          ? { rounds: this.roundsOf(matches, 'winners', cmap) }
          : null,
      };
    }
    return this.buildFormatView(t.format, participants, matches, cmap, t);
  }

  /**
   * Per-format render model (everything except `groups`, which is a legacy
   * whole-tournament shape). Shared by the legacy `view` and each phase's view.
   */
  private buildFormatView(
    format: Exclude<TournamentFormat, 'groups'>,
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
    t: TournamentListRow,
  ): object {
    switch (format) {
      case 'single':
        return { rounds: this.roundsOf(matches, 'winners', cmap) };
      case 'double':
        return {
          winners: this.roundsOf(matches, 'winners', cmap),
          losers: this.roundsOf(matches, 'losers', cmap),
          grandFinal:
            matches
              .filter((m) => m.bracket === 'grand')
              .map((m) => this.toMatchView(m, cmap))[0] ?? null,
        };
      case 'roundrobin':
        return this.leagueView(
          participants.map((p) => p.id),
          matches.filter((m) => m.bracket === 'league'),
          cmap,
        );
      case 'swiss':
        return {
          standings: this.tableOf(
            participants.map((p) => p.id),
            matches.filter((m) => m.bracket === 'swiss'),
            cmap,
          ),
          rounds: this.roundsOf(matches, 'swiss', cmap),
        };
      case 'leaderboard':
        return this.leaderboardView(t, participants, cmap);
      default:
        return {};
    }
  }

  /**
   * Swiss phase view whose standings match the engine's cut: ordered by the
   * phase's tiebreak profile over its carry chain (so the UI can draw the cut
   * line from `phase.advance` + each row's `l` without re-deriving anything).
   */
  private swissPhaseView(
    phase: TournamentPhase,
    phParticipants: TournamentParticipant[],
    phMatches: TournamentMatch[],
    cmap: Map<number, Competitor>,
    ctx: {
      phases: TournamentPhase[];
      allMatches: TournamentMatch[];
      allParticipantIds: number[];
    },
  ): object {
    const entrantIds = phParticipants.map((p) => p.id);
    const chain = matchesForPhaseChain(phase.id, ctx.phases, ctx.allMatches);
    const standings = standingsForEntrants(
      entrantIds,
      ctx.allParticipantIds,
      chain,
      phase.tiebreakProfile,
    ).map((s) => ({
      rank: s.rank,
      c: cmap.get(s.participantId)!,
      played: s.played,
      w: s.w,
      d: s.d,
      l: s.l,
      gf: s.gf,
      ga: s.ga,
      pts: s.pts,
    }));
    return { standings, rounds: this.roundsOf(phMatches, 'swiss', cmap) };
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  private toMatchView(
    m: TournamentMatch,
    cmap: Map<number, Competitor>,
  ): MatchView {
    return {
      id: m.id,
      bracket: m.bracket,
      roundNumber: m.roundNumber,
      position: m.position,
      top: m.topParticipantId != null ? cmap.get(m.topParticipantId) ?? null : null,
      bot: m.botParticipantId != null ? cmap.get(m.botParticipantId) ?? null : null,
      g1: m.topScore,
      g2: m.botScore,
      status: m.status,
      winner:
        m.winnerParticipantId != null
          ? cmap.get(m.winnerParticipantId) ?? null
          : null,
    };
  }

  private roundsOf(
    matches: TournamentMatch[],
    bracket: string,
    cmap: Map<number, Competitor>,
  ): MatchView[][] {
    const inBracket = matches.filter((m) => m.bracket === bracket);
    const rounds = [...new Set(inBracket.map((m) => m.roundNumber))].sort(
      (a, b) => a - b,
    );
    return rounds.map((r) =>
      inBracket
        .filter((m) => m.roundNumber === r)
        .sort((a, b) => a.position - b.position)
        .map((m) => this.toMatchView(m, cmap)),
    );
  }

  private tableOf(
    participantIds: number[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
  ): Standing[] {
    return computeStandings(participantIds, matches).map((s) => ({
      rank: s.rank,
      c: cmap.get(s.participantId)!,
      played: s.played,
      w: s.w,
      d: s.d,
      l: s.l,
      gf: s.gf,
      ga: s.ga,
      pts: s.pts,
    }));
  }

  private crosstable(
    orderedIds: number[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
  ): CrosstableData {
    const idx = new Map(orderedIds.map((id, i) => [id, i]));
    const grid: (CrosstableData['grid'][number][number])[][] = orderedIds.map(
      () => orderedIds.map(() => null),
    );
    for (const m of matches) {
      if (m.status !== 'completed') continue;
      if (m.topParticipantId == null || m.botParticipantId == null) continue;
      const i = idx.get(m.topParticipantId);
      const j = idx.get(m.botParticipantId);
      if (i == null || j == null) continue;
      const ts = m.topScore ?? 0;
      const bs = m.botScore ?? 0;
      // Lowercase w/l/d — the web TnForm/TnCrosstable VM contract.
      const topLetter =
        m.winnerParticipantId == null
          ? 'd'
          : m.winnerParticipantId === m.topParticipantId
            ? 'w'
            : 'l';
      const botLetter = topLetter === 'w' ? 'l' : topLetter === 'l' ? 'w' : 'd';
      grid[i][j] = { r: topLetter, s: `${ts}-${bs}` };
      grid[j][i] = { r: botLetter, s: `${bs}-${ts}` };
    }
    return { entrants: orderedIds.map((id) => cmap.get(id)!), grid };
  }

  private leagueView(
    participantIds: number[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
  ): LeagueView {
    const table = this.tableOf(participantIds, matches, cmap);
    const orderedIds = table.map((s) => Number(s.c.id));
    return {
      table,
      crosstable: this.crosstable(orderedIds, matches, cmap),
      done: matches.filter((m) => m.status === 'completed').length,
      total: matches.length,
    };
  }

  private groupsView(
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
    cmap: Map<number, Competitor>,
    groups: TournamentGroup[],
  ): GroupView[] {
    const groupMatches = matches.filter((m) => m.bracket === 'group');
    const ordered = [...groups].sort((a, b) => a.order - b.order);
    return ordered.map((g) => {
      const memberIds = participants
        .filter((p) => p.groupId === g.id)
        .map((p) => p.id);
      const gMatches = groupMatches.filter((m) => m.groupId === g.id);
      return {
        id: g.id,
        name: g.name,
        done: gMatches.filter((m) => m.status === 'completed').length,
        total: gMatches.length,
        advance: g.advanceCount,
        standings: this.tableOf(memberIds, gMatches, cmap),
      };
    });
  }

  private leaderboardView(
    t: TournamentListRow,
    participants: TournamentParticipant[],
    cmap: Map<number, Competitor>,
  ): { metric: string; unit: string | null; entries: LbEntry[] } {
    const metric = t.metric ?? 'score';
    const sorted = [...participants].sort((a, b) => {
      const av = a.score ?? (metric === 'time' ? Number.MAX_SAFE_INTEGER : 0);
      const bv = b.score ?? (metric === 'time' ? Number.MAX_SAFE_INTEGER : 0);
      return metric === 'time' ? av - bv : bv - av;
    });
    return {
      metric,
      unit: t.unit,
      entries: sorted.map((p, i) => ({
        rank: i + 1,
        author: cmap.get(p.id)!,
        score: p.score ?? 0,
        meta: p.meta,
        unit: t.unit ?? '',
        verified: p.verified,
      })),
    };
  }
}
