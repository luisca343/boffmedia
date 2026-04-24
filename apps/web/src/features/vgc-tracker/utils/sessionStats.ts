import type { Match, MatchResult, SlotRole } from '../types';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface PokemonUsage {
  speciesId: string;
  speciesName: string;
  /** Times actually brought (lead or back role). */
  uses: number;
  /** Times in team preview but not brought (role === 'unknown'). Preview table only. */
  discards: number;
  /** My wins in matches where this Pokémon appeared. */
  wins: number;
  /** My losses in matches where this Pokémon appeared. */
  losses: number;
  draws: number;
  /** My win rate in matches where this Pokémon appeared. Null if no decisive matches. */
  winRate: number | null;
}

export interface EloPoint {
  /** 0 = session startElo anchor; 1+ = match index in chronological order. */
  matchNum: number;
  /** Real ELO or null (creates a gap in the solid line). */
  elo: number | null;
  /** Mirror of elo — consumed by the dashed connectNulls bridge line. */
  eloFill: number | null;
  result?: MatchResult;
  /** Delta from the last known ELO reference. Undefined when no prior reference exists. */
  delta?: number;
}

export interface EloStats {
  current: number | null;
  best: number | null;
  worst: number | null;
  avgDeltaPerMatch: number | null;
  avgDeltaOnWin: number | null;
  avgDeltaOnLoss: number | null;
}

export interface RecordStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  /** Null when no decisive matches. */
  winRate: number | null;
  /** Draws do not break win/loss streaks. Null when no decisive matches recorded. */
  streak: { type: 'win' | 'loss'; count: number } | null;
}

export interface SessionStats {
  record: RecordStats;
  elo: EloStats;
  eloTimeline: EloPoint[];
  myPokemon: PokemonUsage[];
  opponentPreview: PokemonUsage[];
  opponentLeads: PokemonUsage[];
  opponentBacks: PokemonUsage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function average(arr: number[]): number | null {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}

type CompletedMatch = Match & { result: MatchResult; eloAfter: number };
type FinishedMatch = Match & { result: MatchResult };

/**
 * Builds the per-Pokémon usage table for one of the three opponent views.
 *
 * @param roleFilter  Determines which slots to include.
 * @param withDiscards  When true, slots with role==='unknown' increment discards
 *                      instead of uses (used for the team preview table).
 */
function buildOppUsage(
  matches: CompletedMatch[],
  roleFilter: (role: SlotRole) => boolean,
  withDiscards: boolean,
): PokemonUsage[] {
  const map = new Map<string, Omit<PokemonUsage, 'winRate'>>();

  for (const m of matches) {
    // Avoid double-counting a Pokémon that appears twice in the same team (shouldn't happen)
    const seenInMatch = new Set<string>();

    for (const slot of m.opponentTeam.slots) {
      if (!slot.speciesId || !roleFilter(slot.role)) continue;

      const key = slot.speciesId.toLowerCase();
      if (seenInMatch.has(key)) continue;
      seenInMatch.add(key);

      const entry = map.get(key) ?? {
        speciesId: slot.speciesId,
        speciesName: slot.speciesName ?? slot.speciesId,
        uses: 0,
        discards: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };

      if (withDiscards && slot.role === 'unknown') {
        entry.discards++;
      } else {
        entry.uses++;
      }

      // My result is always counted for any appearance in the filtered set
      if (m.result === 'win') entry.wins++;
      else if (m.result === 'loss') entry.losses++;
      else entry.draws++;

      map.set(key, entry);
    }
  }

  return [...map.values()]
    .map((p) => ({
      ...p,
      winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : null,
    }))
    .sort((a, b) => b.uses + b.discards - (a.uses + a.discards));
}

// ─── Main computation ─────────────────────────────────────────────────────────

/**
 * Derives all session statistics from a flat array of matches.
 *
 * "Completed" definition: result !== undefined AND eloAfter !== undefined.
 * All stats tables and ELO metrics are computed over completed matches only.
 *
 * The ELO timeline includes all "finished" matches (result set, eloAfter optional)
 * so that gaps from missing ELO values are visible in the chart.
 */
export function computeSessionStats(
  matches: Match[],
  startElo?: number,
): SessionStats {
  // ── Filter sets ───────────────────────────────────────────────────────────

  const completed = matches.filter(
    (m): m is CompletedMatch =>
      m.result !== undefined && m.eloAfter !== undefined,
  );

  const chronological = [...completed].sort(
    (a, b) => (a.completedAt ?? a.createdAt) - (b.completedAt ?? b.createdAt),
  );

  // ── Record ────────────────────────────────────────────────────────────────

  const wins = completed.filter((m) => m.result === 'win').length;
  const losses = completed.filter((m) => m.result === 'loss').length;
  const draws = completed.filter((m) => m.result === 'draw').length;
  const decisive = wins + losses;

  // Streak: walk backward through decisive matches; draws are skipped entirely
  const decisiveChron = chronological.filter((m) => m.result !== 'draw');
  let streak: RecordStats['streak'] = null;
  if (decisiveChron.length > 0) {
    const lastType = decisiveChron[decisiveChron.length - 1].result as
      | 'win'
      | 'loss';
    let count = 0;
    for (let i = decisiveChron.length - 1; i >= 0; i--) {
      if (decisiveChron[i].result === lastType) count++;
      else break;
    }
    streak = { type: lastType, count };
  }

  // ── ELO stats ─────────────────────────────────────────────────────────────

  const eloValues = chronological.map((m) => m.eloAfter);
  const current = eloValues.length > 0 ? eloValues[eloValues.length - 1] : null;
  const best = eloValues.length > 0 ? Math.max(...eloValues) : null;
  const worst = eloValues.length > 0 ? Math.min(...eloValues) : null;

  const allDeltas: number[] = [];
  const winDeltas: number[] = [];
  const lossDeltas: number[] = [];

  chronological.forEach((m, i) => {
    const prev = i === 0 ? startElo : chronological[i - 1].eloAfter;
    if (prev !== undefined) {
      const delta = m.eloAfter - prev;
      allDeltas.push(delta);
      if (m.result === 'win') winDeltas.push(delta);
      if (m.result === 'loss') lossDeltas.push(delta);
    }
  });

  // ── ELO Timeline ──────────────────────────────────────────────────────────

  const eloTimeline: EloPoint[] = [];

  if (startElo !== undefined) {
    eloTimeline.push({ matchNum: 0, elo: startElo, eloFill: startElo });
  }

  // Use ALL finished matches (result set) — missing eloAfter becomes null gap
  const finishedChron = matches
    .filter((m): m is FinishedMatch => m.result !== undefined)
    .sort((a, b) => (a.completedAt ?? a.createdAt) - (b.completedAt ?? b.createdAt));

  let lastKnownElo: number | undefined = startElo;

  finishedChron.forEach((m, i) => {
    const elo = m.eloAfter ?? null;
    let delta: number | undefined;

    if (elo !== null) {
      if (lastKnownElo !== undefined) {
        delta = elo - lastKnownElo;
      }
      lastKnownElo = elo;
    }

    eloTimeline.push({
      matchNum: i + 1,
      elo,
      eloFill: elo,
      result: m.result,
      delta,
    });
  });

  // ── My Pokémon ────────────────────────────────────────────────────────────

  const myPokemonMap = new Map<string, Omit<PokemonUsage, 'winRate'>>();

  for (const m of completed) {
    for (const slot of m.myTeam.slots) {
      if (!slot.speciesId || slot.role === 'unknown') continue;

      const key = slot.speciesId.toLowerCase();
      const entry = myPokemonMap.get(key) ?? {
        speciesId: slot.speciesId,
        speciesName: slot.speciesName ?? slot.speciesId,
        uses: 0,
        discards: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };

      entry.uses++;
      if (m.result === 'win') entry.wins++;
      else if (m.result === 'loss') entry.losses++;
      else entry.draws++;

      myPokemonMap.set(key, entry);
    }
  }

  const myPokemon = [...myPokemonMap.values()]
    .map((p) => ({
      ...p,
      winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : null,
    }))
    .sort((a, b) => b.uses - a.uses);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    record: {
      played: completed.length,
      wins,
      losses,
      draws,
      winRate: decisive > 0 ? wins / decisive : null,
      streak,
    },
    elo: {
      current,
      best,
      worst,
      avgDeltaPerMatch: average(allDeltas),
      avgDeltaOnWin: average(winDeltas),
      avgDeltaOnLoss: average(lossDeltas),
    },
    eloTimeline,
    myPokemon,
    opponentPreview: buildOppUsage(completed, () => true, true),
    opponentLeads: buildOppUsage(
      completed,
      (r) => r === 'lead1' || r === 'lead2',
      false,
    ),
    opponentBacks: buildOppUsage(
      completed,
      (r) => r === 'back1' || r === 'back2',
      false,
    ),
  };
}
