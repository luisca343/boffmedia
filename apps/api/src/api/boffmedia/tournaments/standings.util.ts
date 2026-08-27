import { TournamentMatch } from '@/_db/schema/BoffMediaTournaments';

interface PhaseChainRef {
  id: number;
  phaseOrder: number;
  carryStandings: boolean;
}

/**
 * The match set a phase's standings are computed over: the phase's own matches,
 * plus (recursively) each earlier phase's matches while `carryStandings` holds —
 * so VGC Day 2 standings fold in Day 1 records. Restrict to the target phase's
 * entrants by passing their ids to `computeStandings`.
 */
export function matchesForPhaseChain(
  phaseId: number,
  phases: PhaseChainRef[],
  allMatches: TournamentMatch[],
): TournamentMatch[] {
  const byId = new Map(phases.map((p) => [p.id, p]));
  const out: TournamentMatch[] = [];
  const seen = new Set<number>();
  let cur = byId.get(phaseId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    const self = cur;
    out.push(...allMatches.filter((m) => m.phaseId === self.id));
    if (!cur.carryStandings) break;
    cur = phases
      .filter((p) => p.phaseOrder < self.phaseOrder)
      .sort((a, b) => b.phaseOrder - a.phaseOrder)[0];
  }
  return out;
}

export interface StandRow {
  participantId: number;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number; // games/points for
  ga: number; // games/points against
  pts: number;
}

export type TiebreakProfile = 'points' | 'resistance';

/**
 * Aggregate completed matches into a standings table (3-1-0 points; byes = win).
 * Tiebreak by `profile`:
 *  - `points` (default): game difference, then games for — football-style.
 *  - `resistance`: Pokémon-style — opponents' match-win % (floored 0.25, byes
 *    excluded), then opponents' opponents' match-win %, then head-to-head, then
 *    game diff. Draws only occur in league/group/swiss.
 */
export function computeStandings(
  participantIds: number[],
  matches: TournamentMatch[],
  profile: TiebreakProfile = 'points',
): (StandRow & { rank: number })[] {
  const map = new Map<number, StandRow>();
  for (const id of participantIds) {
    map.set(id, {
      participantId: id,
      played: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    });
  }

  // Resistance bookkeeping (byes excluded): non-bye record + opponent lists +
  // head-to-head tallies.
  const nbPlayed = new Map<number, number>();
  const nbWins = new Map<number, number>();
  const opponents = new Map<number, number[]>();
  const h2h = new Map<string, number>(); // `${a}>${b}` → a's net wins over b
  for (const id of participantIds) {
    nbPlayed.set(id, 0);
    nbWins.set(id, 0);
    opponents.set(id, []);
  }

  for (const m of matches) {
    // A bye counts as a win for the lone competitor (VGC 3-pointer) — no game
    // diff, no opponent side, but it does count as a played win so byed players
    // don't sink to the bottom and get byed again.
    if (m.status === 'bye') {
      const soloId =
        m.winnerParticipantId ?? m.topParticipantId ?? m.botParticipantId;
      if (soloId == null) continue;
      const row = map.get(soloId);
      if (!row) continue;
      row.played++;
      row.w++;
      row.pts += 3;
      continue;
    }
    if (m.status !== 'completed') continue;
    if (m.topParticipantId == null || m.botParticipantId == null) continue;
    const top = map.get(m.topParticipantId);
    const bot = map.get(m.botParticipantId);
    if (!top || !bot) continue;

    const ts = m.topScore ?? 0;
    const bs = m.botScore ?? 0;
    top.played++;
    bot.played++;
    top.gf += ts;
    top.ga += bs;
    bot.gf += bs;
    bot.ga += ts;

    const a = top.participantId;
    const b = bot.participantId;
    nbPlayed.set(a, nbPlayed.get(a)! + 1);
    nbPlayed.set(b, nbPlayed.get(b)! + 1);
    opponents.get(a)!.push(b);
    opponents.get(b)!.push(a);

    if (m.winnerParticipantId == null) {
      top.d++;
      bot.d++;
      top.pts += 1;
      bot.pts += 1;
    } else if (m.winnerParticipantId === top.participantId) {
      top.w++;
      bot.l++;
      top.pts += 3;
      nbWins.set(a, nbWins.get(a)! + 1);
      h2h.set(`${a}>${b}`, (h2h.get(`${a}>${b}`) ?? 0) + 1);
      h2h.set(`${b}>${a}`, (h2h.get(`${b}>${a}`) ?? 0) - 1);
    } else {
      bot.w++;
      top.l++;
      bot.pts += 3;
      nbWins.set(b, nbWins.get(b)! + 1);
      h2h.set(`${b}>${a}`, (h2h.get(`${b}>${a}`) ?? 0) + 1);
      h2h.set(`${a}>${b}`, (h2h.get(`${a}>${b}`) ?? 0) - 1);
    }
  }

  const rows = [...map.values()];

  if (profile === 'resistance') {
    // Match-win % of a player (as someone's opponent): wins/played over non-bye
    // matches, floored at 0.25.
    const mw = (id: number): number => {
      const p = nbPlayed.get(id) ?? 0;
      return p > 0 ? Math.max(0.25, (nbWins.get(id) ?? 0) / p) : 0.25;
    };
    const mean = (xs: number[]): number =>
      xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    const omw = new Map<number, number>();
    for (const id of participantIds) {
      omw.set(id, mean((opponents.get(id) ?? []).map(mw)));
    }
    const oomw = new Map<number, number>();
    for (const id of participantIds) {
      oomw.set(id, mean((opponents.get(id) ?? []).map((o) => omw.get(o) ?? 0)));
    }
    rows.sort(
      (x, y) =>
        y.pts - x.pts ||
        (omw.get(y.participantId) ?? 0) - (omw.get(x.participantId) ?? 0) ||
        (oomw.get(y.participantId) ?? 0) - (oomw.get(x.participantId) ?? 0) ||
        -(h2h.get(`${x.participantId}>${y.participantId}`) ?? 0) ||
        y.gf - y.ga - (x.gf - x.ga) ||
        y.gf - x.gf ||
        x.participantId - y.participantId,
    );
  } else {
    rows.sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gf - b.ga - (a.gf - a.ga) ||
        b.gf - a.gf ||
        a.participantId - b.participantId,
    );
  }
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Standings for a phase's entrants that still reflect each entrant's *complete*
 * record — including matches against players who didn't qualify (e.g. a VGC Day 2
 * player's Day 1 losses to eliminated opponents). Compute over the full field so
 * records + resistance are whole, then keep only the entrants and re-rank 1..k.
 */
export function standingsForEntrants(
  entrantIds: number[],
  allParticipantIds: number[],
  matches: TournamentMatch[],
  profile: TiebreakProfile = 'points',
): (StandRow & { rank: number })[] {
  const set = new Set(entrantIds);
  return computeStandings(allParticipantIds, matches, profile)
    .filter((r) => set.has(r.participantId))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * The advancement rule, as a pure function over an already-ranked table.
 *
 * Lives here rather than inside the advancement service because two callers
 * need the same answer: `advance` (which acts on it) and the tournament detail
 * projection (which shows players who is currently making the cut). The web
 * used to reimplement all four branches to render that highlight, so a change
 * to the rule silently disagreed with the bracket until someone noticed.
 *
 * Requires `standings` in rank order — every branch is positional.
 */
export interface AdvanceRule {
  advanceType: 'all' | 'top_n' | 'record' | 'top_or_record' | null;
  advanceCount: number | null;
  advanceMaxLosses: number | null;
}

export function selectQualifiers<T extends { l: number }>(
  rule: AdvanceRule,
  standings: T[],
): T[] {
  switch (rule.advanceType) {
    case 'top_n':
      return standings.slice(0, rule.advanceCount ?? standings.length);
    case 'record': {
      const cap = rule.advanceMaxLosses ?? Number.MAX_SAFE_INTEGER;
      const eligible = standings.filter((s) => s.l <= cap);
      return rule.advanceCount != null
        ? eligible.slice(0, rule.advanceCount)
        : eligible;
    }
    case 'top_or_record': {
      // Union: the top N by standings OR anyone at ≤ maxLosses losses.
      // Standings are sorted, so both sets are contiguous from the top — the
      // qualifier count is max(N, #{≤maxLosses}), i.e. an asymmetric cut.
      const n = rule.advanceCount ?? 0;
      const cap = rule.advanceMaxLosses ?? Number.MAX_SAFE_INTEGER;
      return standings.filter((s, i) => i < n || s.l <= cap);
    }
    case 'all':
    default:
      return standings;
  }
}
