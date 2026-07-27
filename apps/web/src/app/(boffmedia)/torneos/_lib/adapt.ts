import type { DkBracketRound } from "@/components/boffmedia/ui/tools/datakit"
import type {
  TnCompetitor,
  TnMatch,
  TnStanding,
  TnCrosstableData,
  TnGroup,
  TnLeague,
  TnLb,
  TnLbEntry,
} from "@/components/boffmedia/ui/tournaments"
import type {
  TnCompetitorApi,
  TnMatchApi,
  TnStandingApi,
  TnCrosstableApi,
  TnGroupApi,
  TnLbEntryApi,
  TnViewApi,
} from "@/services/api/boffmedia/tournamentsService"

export function comp(a: TnCompetitorApi | null | undefined): TnCompetitor | null {
  if (!a) return null
  return {
    id: a.id,
    kind: a.kind,
    name: a.name,
    tag: a.tag ?? undefined,
    flag: a.flag ?? undefined,
    country: a.country ?? undefined,
    seed: a.seed ?? undefined,
    hue: a.hue ?? undefined,
    avatar: a.avatar ?? undefined,
    roster: a.roster,
  }
}

// API match status → the DkLive/TnBracketMatch vocabulary (which shows scores
// only on "final", the warn border on "playing", and defaults unknowns to live).
const STATUS_MAP: Record<string, string> = {
  completed: "final",
  bye: "final",
  live: "playing",
  ready: "soon",
  pending: "pending",
}

export function match(a: TnMatchApi): TnMatch {
  const top = comp(a.top)
  const bot = comp(a.bot)
  // TnBracketMatch compares winner to top/bot by REFERENCE (for scores + win
  // coloring), so winner must be the very same object, not a fresh one.
  let winner: TnCompetitor | null = null
  if (a.winner) {
    winner =
      a.winner.id === a.top?.id
        ? top
        : a.winner.id === a.bot?.id
          ? bot
          : comp(a.winner)
  }
  return {
    top,
    bot,
    topSeed: a.top?.seed ?? null,
    botSeed: a.bot?.seed ?? null,
    g1: a.g1,
    g2: a.g2,
    status: STATUS_MAP[a.status] ?? a.status,
    winner,
    // TnBracketMatch gives the grand final ("gf") its accent border.
    bracket: a.bracket === "grand" ? "gf" : a.bracket,
  }
}

/** Translator for `torneos.bracket`, threaded in — this is a pure module, so
 *  calling `t()` here at module scope would freeze whichever locale loaded first. */
export type BracketT = (key: string, values?: Record<string, string | number>) => string

const roundName = (t: BracketT, matchesInRound: number): string => {
  const players = matchesInRound * 2
  return players <= 2
    ? t("roundFinal")
    : players === 4
      ? t("roundSemis")
      : players === 8
        ? t("roundQuarters")
        : players === 16
          ? t("round16")
          : t("roundOf", { players })
}

export function bracketRounds(
  rounds: TnMatchApi[][] | undefined,
  t: BracketT,
): DkBracketRound<TnMatch>[] {
  return (rounds ?? []).map((r) => ({
    phase: roundName(t, r.length),
    matches: r.map(match),
  }))
}

export function standing(a: TnStandingApi): TnStanding {
  return {
    rank: a.rank,
    c: comp(a.c)!,
    played: a.played,
    w: a.w,
    d: a.d,
    l: a.l,
    gf: a.gf,
    ga: a.ga,
    pts: a.pts,
  }
}

export function crosstable(a: TnCrosstableApi | undefined): TnCrosstableData {
  return {
    entrants: (a?.entrants ?? []).map((c) => comp(c)!),
    grid: a?.grid ?? [],
  }
}

export function group(a: TnGroupApi): TnGroup {
  return {
    name: a.name,
    done: a.done,
    total: a.total,
    standings: a.standings.map(standing),
  }
}

export function league(view: TnViewApi): TnLeague {
  return {
    table: (view.table ?? []).map(standing),
    crosstable: crosstable(view.crosstable),
    done: view.done,
    total: view.total,
  }
}

export function lbEntry(a: TnLbEntryApi): TnLbEntry {
  return {
    rank: a.rank,
    author: comp(a.author)!,
    score: a.score,
    meta: a.meta ?? "",
    unit: a.unit,
    verified: a.verified,
  }
}

export function leaderboard(view: TnViewApi): TnLb {
  return {
    metric: view.metric === "time" ? "time" : "score",
    unit: view.unit ?? undefined,
    entries: (view.entries ?? []).map(lbEntry),
  }
}
