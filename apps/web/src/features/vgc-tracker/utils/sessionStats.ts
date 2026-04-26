import type { Match, MatchResult, SlotRole, TeamSnapshot } from '../types';

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
  /** Longest win or loss streak in this session. */
  bestStreak: { type: 'win' | 'loss'; count: number } | null;
}

export interface LeadPairStats {
  key: string;
  lead1Id: string;
  lead1Name: string;
  lead2Id: string;
  lead2Name: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeSlotStats {
  slot: TimeSlot;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number | null;
}

export interface HeatmapCell {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slot: TimeSlot;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface MatchupPair {
  pokemon1Id: string;
  pokemon1Name: string;
  pokemon2Id: string;
  pokemon2Name: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface ArchetypeStats {
  archetype: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface SessionStats {
  record: RecordStats;
  elo: EloStats;
  eloTimeline: EloPoint[];
  myPokemon: PokemonUsage[];
  opponentPreview: PokemonUsage[];
  opponentLeads: PokemonUsage[];
  opponentBacks: PokemonUsage[];
  myLeadPairs: LeadPairStats[];
  opponentLeadPairs: LeadPairStats[];
  timeSlots: TimeSlotStats[];
  heatmap: HeatmapCell[];
  matchupMatrix: MatchupPair[];
  archetypeBreakdown: ArchetypeStats[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function average(arr: number[]): number | null {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}

type CompletedMatch = Match & { result: MatchResult; eloAfter: number };
export type FinishedMatch = Match & { result: MatchResult };

/**
 * Builds the per-Pokémon usage table for one of the three opponent views.
 * Exported so regulation-meta can reuse it without duplication.
 */
export function buildOppUsage(
  matches: FinishedMatch[],
  roleFilter: (role: SlotRole) => boolean,
  withDiscards: boolean,
): PokemonUsage[] {
  const map = new Map<string, Omit<PokemonUsage, 'winRate'>>();

  for (const m of matches) {
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

function buildLeadPairs(
  matches: CompletedMatch[],
  teamSelector: (m: CompletedMatch) => TeamSnapshot,
): LeadPairStats[] {
  const map = new Map<string, Omit<LeadPairStats, 'winRate'>>();

  for (const m of matches) {
    const slots = teamSelector(m).slots;
    const lead1 = slots.find((s) => s.role === 'lead1' && s.speciesId);
    const lead2 = slots.find((s) => s.role === 'lead2' && s.speciesId);
    if (!lead1?.speciesId || !lead2?.speciesId) continue;

    const [a, b] = [lead1, lead2].sort((x, y) =>
      x.speciesId!.localeCompare(y.speciesId!),
    );
    const key = `${a.speciesId}+${b.speciesId}`;

    const entry = map.get(key) ?? {
      key,
      lead1Id: a.speciesId!,
      lead1Name: a.speciesName ?? a.speciesId!,
      lead2Id: b.speciesId!,
      lead2Name: b.speciesName ?? b.speciesId!,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };

    entry.games++;
    if (m.result === 'win') entry.wins++;
    else if (m.result === 'loss') entry.losses++;
    else entry.draws++;

    map.set(key, entry);
  }

  return [...map.values()]
    .map((p) => ({
      ...p,
      winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : null,
    }))
    .sort((a, b) => b.games - a.games);
}

function getTimeSlot(ts: number): TimeSlot {
  const h = new Date(ts).getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 21) return 'afternoon';
  if (h >= 21) return 'evening';
  return 'night';
}

function buildHeatmap(matches: CompletedMatch[]): HeatmapCell[] {
  const map = new Map<string, Omit<HeatmapCell, 'winRate'>>();

  for (const m of matches) {
    const ts = m.completedAt ?? m.createdAt;
    const dayOfWeek = new Date(ts).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const slot = getTimeSlot(ts);
    const key = `${dayOfWeek}:${slot}`;

    const entry = map.get(key) ?? { dayOfWeek, slot, games: 0, wins: 0, losses: 0 };
    entry.games++;
    if (m.result === 'win') entry.wins++;
    else if (m.result === 'loss') entry.losses++;
    map.set(key, entry);
  }

  return [...map.values()].map((e) => ({
    ...e,
    winRate: e.wins + e.losses > 0 ? e.wins / (e.wins + e.losses) : null,
  }));
}

function buildMatchupMatrix(matches: CompletedMatch[]): MatchupPair[] {
  const map = new Map<string, Omit<MatchupPair, 'winRate'>>();

  for (const m of matches) {
    const brought = m.myTeam.slots.filter((s) => s.speciesId && s.role !== 'unknown');
    for (let i = 0; i < brought.length; i++) {
      for (let j = i + 1; j < brought.length; j++) {
        const [a, b] = [brought[i], brought[j]].sort((x, y) =>
          x.speciesId!.localeCompare(y.speciesId!),
        );
        const key = `${a.speciesId}+${b.speciesId}`;
        const entry = map.get(key) ?? {
          pokemon1Id: a.speciesId!,
          pokemon1Name: a.speciesName ?? a.speciesId!,
          pokemon2Id: b.speciesId!,
          pokemon2Name: b.speciesName ?? b.speciesId!,
          games: 0,
          wins: 0,
          losses: 0,
        };
        entry.games++;
        if (m.result === 'win') entry.wins++;
        else if (m.result === 'loss') entry.losses++;
        map.set(key, entry);
      }
    }
  }

  return [...map.values()]
    .map((p) => ({
      ...p,
      winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : null,
    }))
    .sort((a, b) => b.games - a.games);
}

function buildArchetypeBreakdown(matches: CompletedMatch[]): ArchetypeStats[] {
  const map = new Map<string, Omit<ArchetypeStats, 'winRate'>>();

  for (const m of matches) {
    if (!m.opponentArchetype) continue;
    const key = m.opponentArchetype.toLowerCase().trim();
    const entry = map.get(key) ?? {
      archetype: m.opponentArchetype.trim(),
      games: 0,
      wins: 0,
      losses: 0,
    };
    entry.games++;
    if (m.result === 'win') entry.wins++;
    else if (m.result === 'loss') entry.losses++;
    map.set(key, entry);
  }

  return [...map.values()]
    .map((p) => ({ ...p, winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : null }))
    .sort((a, b) => b.games - a.games);
}

function buildTimeSlots(matches: CompletedMatch[]): TimeSlotStats[] {
  const order: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];
  const map = new Map<TimeSlot, Omit<TimeSlotStats, 'winRate'>>(
    order.map((s) => [s, { slot: s, games: 0, wins: 0, losses: 0, draws: 0 }]),
  );

  for (const m of matches) {
    const slot = getTimeSlot(m.completedAt ?? m.createdAt);
    const entry = map.get(slot)!;
    entry.games++;
    if (m.result === 'win') entry.wins++;
    else if (m.result === 'loss') entry.losses++;
    else entry.draws++;
  }

  return order
    .map((s) => {
      const e = map.get(s)!;
      return {
        ...e,
        winRate: e.wins + e.losses > 0 ? e.wins / (e.wins + e.losses) : null,
      };
    })
    .filter((e) => e.games > 0);
}

// ─── Main computation ─────────────────────────────────────────────────────────

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

  const decisiveChron = chronological.filter((m) => m.result !== 'draw');
  let streak: RecordStats['streak'] = null;
  let bestStreak: RecordStats['bestStreak'] = null;
  if (decisiveChron.length > 0) {
    // Current streak
    const lastType = decisiveChron[decisiveChron.length - 1].result as 'win' | 'loss';
    let count = 0;
    for (let i = decisiveChron.length - 1; i >= 0; i--) {
      if (decisiveChron[i].result === lastType) count++;
      else break;
    }
    streak = { type: lastType, count };

    // Best streak
    let runType = decisiveChron[0].result as 'win' | 'loss';
    let runCount = 1;
    let best = { type: runType, count: 1 };
    for (let i = 1; i < decisiveChron.length; i++) {
      const r = decisiveChron[i].result as 'win' | 'loss';
      if (r === runType) {
        runCount++;
        if (runCount > best.count) best = { type: runType, count: runCount };
      } else {
        runType = r;
        runCount = 1;
      }
    }
    bestStreak = best;
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

  const finishedChron = matches
    .filter((m): m is FinishedMatch => m.result !== undefined)
    .sort((a, b) => (a.completedAt ?? a.createdAt) - (b.completedAt ?? b.createdAt));

  let lastKnownElo: number | undefined = startElo;

  finishedChron.forEach((m, i) => {
    const elo = m.eloAfter ?? null;
    let delta: number | undefined;

    if (elo !== null) {
      if (lastKnownElo !== undefined) delta = elo - lastKnownElo;
      lastKnownElo = elo;
    }

    eloTimeline.push({ matchNum: i + 1, elo, eloFill: elo, result: m.result, delta });
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
      bestStreak,
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
    opponentLeads: buildOppUsage(completed, (r) => r === 'lead1' || r === 'lead2', false),
    opponentBacks: buildOppUsage(completed, (r) => r === 'back1' || r === 'back2', false),
    myLeadPairs: buildLeadPairs(completed, (m) => m.myTeam),
    opponentLeadPairs: buildLeadPairs(completed, (m) => m.opponentTeam),
    timeSlots: buildTimeSlots(completed),
    heatmap: buildHeatmap(completed),
    matchupMatrix: buildMatchupMatrix(completed),
    archetypeBreakdown: buildArchetypeBreakdown(completed),
  };
}
