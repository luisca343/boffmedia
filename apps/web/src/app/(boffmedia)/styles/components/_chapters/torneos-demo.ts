// Demo data for the Torneos chapter — the tournaments API doesn't exist yet, so
// every specimen is fed from here. [deferred]
import type { TnCompetitor, TnMatch } from "@/components/boffmedia/ui/tournaments"
import type { TmComp, TmMon, TmPlayer } from "@/components/boffmedia/ui/tournaments/TmMatchView"
import type { TnGroup, TnLeague } from "@/components/boffmedia/ui/tournaments/TnStandings"
import type { TnLb } from "@/components/boffmedia/ui/tournaments/TnLeaderboard"
import type { RadialRound } from "@/components/boffmedia/ui/tournaments/TnRadialBracket"
import type { DkBracketRound } from "@/components/boffmedia/ui/tools/datakit"

export const TN_SOLO: TnCompetitor = { id: "aya", kind: "solo", name: "Aya Nakamura", tag: "AyaN42", flag: "🇯🇵", country: "JP", countryName: "Japón", seed: 1, hue: 210 }
export const TN_SOLO2: TnCompetitor = { id: "leo", kind: "solo", name: "Leo Vargas", tag: "LVargas18", flag: "🇪🇸", country: "ES", countryName: "España", seed: 8, hue: 30 }
export const TN_TEAM: TnCompetitor = { id: "nova", kind: "team", name: "Equipo Nova", tag: "NVA", flag: "🇮🇹", country: "IT", countryName: "Italia", seed: 2, hue: 280, roster: [{}, {}, {}] }

function tnMatch(a: TnCompetitor | null, b: TnCompetitor | null, ga: number, gb: number, status: string, seedA: number | null, seedB: number | null): TnMatch {
  return { top: a, bot: b, topSeed: seedA, botSeed: seedB, g1: ga, g2: gb, status, winner: status === "final" ? (ga > gb ? a : b) : null }
}

export const TN_SINGLE: DkBracketRound<TnMatch>[] = [
  {
    phase: "Semifinales",
    matches: [
      tnMatch(TN_SOLO, TN_TEAM, 2, 1, "final", 1, 4),
      tnMatch(TN_SOLO2, { id: "x", kind: "solo", name: "Mika Klein", flag: "🇩🇪", country: "DE", countryName: "Alemania", seed: 5, hue: 120 }, 1, 2, "playing", 8, 5),
    ],
  },
  { phase: "Final", matches: [tnMatch(TN_SOLO, null, 0, 0, "pending", 1, null)] },
]

export const TN_GROUP: TnGroup = {
  name: "Grupo A",
  label: "A",
  done: 4,
  total: 6,
  standings: [
    { rank: 1, c: TN_SOLO, played: 2, w: 2, d: 0, l: 0, gf: 4, ga: 1, pts: 6 },
    { rank: 2, c: TN_TEAM, played: 3, w: 2, d: 0, l: 1, gf: 5, ga: 4, pts: 6 },
    { rank: 3, c: { id: "m3", kind: "solo", name: "Sora Rossi", flag: "🇮🇹", country: "IT", countryName: "Italia", seed: 6, hue: 90 }, played: 2, w: 0, d: 1, l: 1, gf: 2, ga: 3, pts: 1 },
    { rank: 4, c: TN_SOLO2, played: 3, w: 0, d: 1, l: 2, gf: 1, ga: 4, pts: 1 },
  ],
}

export const TN_LEAGUE: TnLeague = (() => {
  const es: TnCompetitor[] = [TN_SOLO, TN_SOLO2, TN_TEAM, { id: "m4", kind: "solo", name: "Ren Costa", tag: "RCosta9", flag: "🇵🇹", country: "PT", countryName: "Portugal", seed: 4, hue: 200 }]
  const grid: ({ r: string; s: string } | null)[][] = es.map(() => es.map(() => null))
  const set = (i: number, j: number, r: string, s: string) => {
    grid[i][j] = { r, s }
    grid[j][i] = { r: r === "d" ? "d" : r === "w" ? "l" : "w", s: s.split("-").reverse().join("-") }
  }
  set(0, 1, "w", "2-0")
  set(0, 2, "w", "2-1")
  set(0, 3, "d", "1-1")
  set(1, 2, "l", "0-2")
  set(2, 3, "w", "2-1")
  const table = [
    { rank: 1, c: es[0], played: 3, w: 2, d: 1, l: 0, gf: 5, ga: 2, pts: 7 },
    { rank: 2, c: es[2], played: 3, w: 2, d: 0, l: 1, gf: 5, ga: 3, pts: 6 },
    { rank: 3, c: es[3], played: 2, w: 0, d: 1, l: 1, gf: 2, ga: 3, pts: 1 },
    { rank: 4, c: es[1], played: 2, w: 0, d: 0, l: 2, gf: 0, ga: 4, pts: 0 },
  ]
  return { table, crosstable: { entrants: es, grid }, done: 5, total: 6 }
})()

export const TN_LB: TnLb = {
  metric: "score",
  unit: "pts",
  entries: [
    { rank: 1, author: { id: "a1", kind: "solo", name: "Rin Kato", flag: "🇨🇱", country: "CL", countryName: "Chile", hue: 340 }, score: 4820, meta: "4.820", unit: "pts", tag: "Tanque", verified: true },
    { rank: 2, author: { id: "a2", kind: "solo", name: "Adri Dupont", flag: "🇲🇽", country: "MX", countryName: "México", hue: 40 }, score: 4610, meta: "4.610", unit: "pts", tag: "DPS puro", verified: true },
    { rank: 3, author: { id: "a3", kind: "solo", name: "Vera Bianchi", flag: "🇨🇭", country: "CH", countryName: "Suiza", hue: 160 }, score: 4280, meta: "4.280", unit: "pts", tag: "Soporte", verified: false },
  ],
}

const TN_FLAGS: [string, string, string][] = [
  ["🇪🇸", "ES", "España"], ["🇫🇷", "FR", "Francia"], ["🇩🇪", "DE", "Alemania"], ["🇮🇹", "IT", "Italia"], ["🇧🇷", "BR", "Brasil"], ["🇯🇵", "JP", "Japón"], ["🇵🇹", "PT", "Portugal"], ["🇳🇱", "NL", "P. Bajos"],
  ["🇦🇷", "AR", "Argentina"], ["🇲🇽", "MX", "México"], ["🇬🇧", "GB", "R. Unido"], ["🇰🇷", "KR", "Corea"], ["🇧🇪", "BE", "Bélgica"], ["🇭🇷", "HR", "Croacia"], ["🇺🇸", "US", "EE. UU."], ["🇨🇦", "CA", "Canadá"],
  ["🇸🇪", "SE", "Suecia"], ["🇳🇴", "NO", "Noruega"], ["🇩🇰", "DK", "Dinamarca"], ["🇨🇭", "CH", "Suiza"], ["🇵🇱", "PL", "Polonia"], ["🇦🇹", "AT", "Austria"], ["🇨🇱", "CL", "Chile"], ["🇨🇴", "CO", "Colombia"],
  ["🇺🇾", "UY", "Uruguay"], ["🇪🇨", "EC", "Ecuador"], ["🇵🇪", "PE", "Perú"], ["🇦🇺", "AU", "Australia"], ["🇳🇿", "NZ", "N. Zelanda"], ["🇿🇦", "ZA", "Sudáfrica"], ["🇳🇬", "NG", "Nigeria"], ["🇸🇳", "SN", "Senegal"],
  ["🇬🇭", "GH", "Ghana"], ["🇨🇮", "CI", "C. Marfil"], ["🇲🇦", "MA", "Marruecos"], ["🇩🇿", "DZ", "Argelia"], ["🇪🇬", "EG", "Egipto"], ["🇹🇷", "TR", "Turquía"], ["🇬🇷", "GR", "Grecia"], ["🇷🇸", "RS", "Serbia"],
  ["🇨🇿", "CZ", "Chequia"], ["🇺🇦", "UA", "Ucrania"], ["🇮🇪", "IE", "Irlanda"], ["🇫🇮", "FI", "Finlandia"], ["🇸🇰", "SK", "Eslovaquia"], ["🇸🇮", "SI", "Eslovenia"], ["🇮🇸", "IS", "Islandia"], ["🇨🇷", "CR", "C. Rica"],
]

export const TN_RADIAL_STEPS = [8, 16, 32, 64, 128, 256]

// Deterministic elimination with upsets for N seats (power of two). `played` =
// rounds already completed → the rest are pending.
export function tnRadialRounds(n: number, played?: number): { rounds: RadialRound[]; champion: TnCompetitor | null } {
  const totalR = Math.round(Math.log2(n))
  if (played == null) played = totalR
  const seats: TnCompetitor[] = []
  for (let i = 0; i < n; i++) {
    const f = TN_FLAGS[i % TN_FLAGS.length]
    const rep = Math.floor(i / TN_FLAGS.length)
    seats.push({ id: "r" + i, kind: "solo", name: f[2] + (rep ? " " + (rep + 1) : ""), flag: f[0], country: f[1], countryName: f[2], seed: i + 1, hue: (i * 41) % 360 })
  }
  const rounds: RadialRound[] = []
  let comp: (TnCompetitor | null)[] = seats.slice()
  let r = 0
  while (comp.length > 1) {
    const done = r < played
    const matches: TnMatch[] = []
    const next: (TnCompetitor | null)[] = []
    for (let m = 0; m < comp.length; m += 2) {
      const a = comp[m]
      const b = comp[m + 1]
      const aWins = m === 0 ? true : (m * 7 + r * 13) % 5 !== 1
      const w = done ? (aWins ? a : b) : null
      matches.push({ top: a, bot: b, topSeed: a && a.seed, botSeed: b && b.seed, g1: done ? (aWins ? 3 : 1) : null, g2: done ? (aWins ? 1 : 3) : null, status: done ? "final" : "pendiente", winner: w })
      next.push(w)
    }
    rounds.push({ phase: "R" + r, matches })
    comp = next
    r++
  }
  return { rounds, champion: played >= totalR ? (comp[0] as TnCompetitor | null) : null }
}

// ---- live match (manual report) --------------------------------------------
const TN_OPP_TEAM: TmMon[] = [
  { slot: 0, dex: 727, name: "Incineroar", item: "Chaleco Asalto", ability: "Intimidación", tera: "Grass", moves: ["Sorpresa", "Buena Baza", "Despedida", "Envite Ígneo"] },
  { slot: 1, dex: 987, name: "Flutter Mane", item: "Energía Potencia", ability: "Protosíntesis", tera: "Fairy", moves: ["Fuerza Lunar", "Bola Sombra", "Viento Hielo", "Protección"] },
  { slot: 2, dex: 812, name: "Rillaboom", item: "Semilla Milagro", ability: "Hierba Densa", tera: "Fire", moves: ["Sorpresa", "Bofetón Hierba", "Mazazo", "Ida y Vuelta"] },
  { slot: 3, dex: 892, name: "Urshifu", item: "Banda Focus", ability: "Puño Invisible", tera: "Water", moves: ["Azote Torrencial", "A Bocajarro", "Ataque Óseo", "Protección"] },
  { slot: 4, dex: 591, name: "Amoonguss", item: "Casco Dentado", ability: "Regeneración", tera: "Water", moves: ["Espora", "Polvo Ira", "Cañón Polen", "Protección"] },
  { slot: 5, dex: 645, name: "Landorus-T", item: "Pañuelo Elección", ability: "Intimidación", tera: "Flying", moves: ["Terremoto", "Ida y Vuelta", "Avalancha", "Yo Primero"] },
]

export const TN_MATCH: { comp: TmComp; me: TmPlayer; opp: TmPlayer } = {
  comp: { title: "The Grand Champions Festival" },
  me: { id: "me", kind: "solo", name: "Luisca", tag: "Luisca", flag: "🇪🇸", country: "ES", countryName: "España", hue: 28, w: 4, l: 1, d: 0, pts: 12 },
  opp: { id: "gree47", kind: "solo", name: "gree47", tag: "Gree47", flag: "🇯🇵", country: "JP", countryName: "Japón", hue: 210, w: 0, l: 1, d: 0, pts: 0, _pk: TN_OPP_TEAM },
}
