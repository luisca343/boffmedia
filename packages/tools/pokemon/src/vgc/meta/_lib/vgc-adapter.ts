import type { PokemonUsageDetail, LimitlessPlayerEntry, LimitlessPlayerTeam, DivergenceResult as ApiDivergenceResult, SpeciesTeamEntry } from "../../service"
import type { PokeData, UsageEntry, PlayerEntry, TeamSlot, DivergenceResult } from "./meta-types"

const SPECIES_DEX: Record<string, number> = {
  incineroar: 727, "flutter-mane": 987, fluttermane: 987, urshifu: 892,
  rillaboom: 812, landorus: 645, landorustherian: 645, "iron-hands": 992,
  ironhands: 992, amoonguss: 591, "chien-pao": 1002, chienpao: 1002,
  calyrex: 898, calyrexshadow: 898, miraidon: 1008, whimsicott: 547,
  "raging-bolt": 1021, ragingbolt: 1021, gholdengo: 1000, annihilape: 979,
  arcanine: 59, palafin: 963, "tornadus-therian": 642, tornadus: 641,
  indeedee: 876, farigiraf: 981, gambit: 983, kingambit: 983,
  garchomp: 445, heatran: 485, cresselia: 488, tornadusincarnate: 641,
  dragonite: 149, gastrodon: 423, pelipper: 279, politoed: 186,
  tyranitar: 248, baxcalibur: 998, glimmora: 970, maushold: 925,
  meowscarade: 908, skeledirge: 911, quaquaval: 914, dondozo: 977,
  tatsugiri: 978, flutter: 987, greattusk: 984, "great-tusk": 984,
  screamtail: 985, "scream-tail": 985, brutebonnet: 986, "brute-bonnet": 986,
  slitherwing: 988, "slither-wing": 988, sandyshocks: 989, "sandy-shocks": 989,
  ironbundle: 990, ironvaliant: 993, "iron-valiant": 993, ironmoth: 994,
  "iron-moth": 994, ironthorns: 995, "iron-thorns": 995, ironjugulis: 991,
  "iron-jugulis": 991, walkingwake: 1009, "walking-wake": 1009,
  ironleaves: 1010, "iron-leaves": 1010, dipplin: 1011, poltchageist: 1012,
  sinistcha: 1012, okidogi: 1014, munkidori: 1015, fezandipiti: 1016,
  ogerpon: 1017, archaludon: 1018, hydrapple: 1019, gougingfire: 1020,
  ironboulder: 1022, "iron-boulder": 1022, ironcrown: 1023, "iron-crown": 1023,
  terapagos: 1024, pecharunt: 1025, bloodmoon: 9019, ursaluna: 9019,
}

function getDex(speciesId: string, speciesName: string): number {
  const key = speciesId.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (SPECIES_DEX[key]) return SPECIES_DEX[key]
  const nameKey = speciesName.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (SPECIES_DEX[nameKey]) return SPECIES_DEX[nameKey]
  return 0
}

export function toUsageEntry(d: PokemonUsageDetail): UsageEntry {
  return { id: d.speciesId, usage: d.usagePercent, count: d.rawCount }
}

export function toPokeData(d: PokemonUsageDetail): PokeData {
  return {
    id: d.speciesId,
    name: d.speciesName,
    dex: getDex(d.speciesId, d.speciesName),
    types: d.types,
    base: d.baseStats,
    abilities: d.abilities.map((a) => ({ name: a.name, pct: a.percent })),
    items: d.items.map((i) => ({ name: i.name, pct: i.percent })),
    moves: d.moves.map((m) => ({ name: m.name, pct: m.percent })),
    tera: d.teraTypes.map((t) => ({ name: t.name, pct: t.percent })),
    mates: d.teammates.map((t) => ({ id: t.name, pct: t.percent })),
    spreads: d.spreads.map((s) => ({
      nature: s.nature,
      ev: s.spread.split("/").map(Number),
      pct: s.percent,
    })),
  }
}

// `teraNoneLabel`/`teamFallback` are Spanish defaults (matches on-screen copy today);
// callers with access to `t()` should pass `t("meta.adapter.teraNone")` / `t("meta.adapter.teamFallback")`.
export function toTeamSlot(
  slot: { speciesName: string; item?: string; tera?: string; moves: string[] },
  teraNoneLabel = "Nada",
): TeamSlot {
  return {
    dex: getDex(slot.speciesName, slot.speciesName),
    name: slot.speciesName,
    tera: slot.tera || teraNoneLabel,
    item: slot.item || "",
    moves: slot.moves,
  }
}

export function toTeamEntry(
  entry: SpeciesTeamEntry,
  teamFallback = "Equipo",
  teraNoneLabel = "Nada",
): {
  slug: string
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
} {
  return {
    slug: `${entry.playerId}-${entry.source}`,
    name: entry.rank || entry.playerName || teamFallback,
    record: entry.record || "—",
    team: entry.slots.map((s) => toTeamSlot(s, teraNoneLabel)),
    rawText: entry.rawText,
  }
}

export function toPlayerEntry(
  player: LimitlessPlayerEntry,
  teamCache: Map<string, LimitlessPlayerTeam>,
  teraNoneLabel = "Nada",
): PlayerEntry {
  const team = teamCache.get(player.playerSlug)
  return {
    slug: player.playerSlug,
    placing: player.placing,
    name: player.playerName,
    record: player.record || "—",
    team: team
      ? team.slots.map((s) => ({
          dex: getDex(s.speciesName, s.speciesName),
          name: s.speciesName,
          tera: s.tera || teraNoneLabel,
          item: s.item || "",
          moves: s.moves,
        }))
      : [],
    rawText: team?.rawText || "",
  }
}

export function toDivergenceResult(result: ApiDivergenceResult): DivergenceResult {
  return {
    rows: result.rows.map((r) => ({
      id: r.speciesId,
      ladder: r.ladderPercent,
      tournament: r.tournamentPercent,
      delta: r.deltaPercent,
      absDelta: r.absDeltaPercent,
      badge: r.badge,
    })),
    ladderFormat: result.ladderFormat,
    ladderMonth: result.ladderMonth,
    rowCount: result.rowCount,
  }
}
