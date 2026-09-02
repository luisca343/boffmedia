// v3 «Señal» — Sorteos (giveaways) draw utilities — pure types + algorithms.

export interface Entrant {
  id: string
  name: string
  weight: number
}
export interface HistoryRound {
  round: number
  seed: string
  at: number
  winners: { name: string; weight: number }[]
}
export interface Draw {
  seed: string
  winners: Entrant[]
  pool: Entrant[]
  weighted: boolean
}
export type Phase = "setup" | "spin" | "reveal"

/* ── deterministic PRNG (mulberry32) — same seed + same list ⇒ same result ── */
export function hashSeed(str: string): number {
  const s = String(str)
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pickWinners(pool: Entrant[], n: number, rng: () => number, weighted: boolean): Entrant[] {
  const items = pool.slice()
  const out: Entrant[] = []
  for (let k = 0; k < n && items.length; k++) {
    const total = items.reduce((s, e) => s + (weighted ? Math.max(1, e.weight || 1) : 1), 0)
    let r = rng() * total
    let idx = 0
    for (let i = 0; i < items.length; i++) {
      r -= weighted ? Math.max(1, items[i].weight || 1) : 1
      idx = i
      if (r <= 0) break
    }
    out.push(items[idx])
    items.splice(idx, 1)
  }
  return out
}

export function oddsOf(pool: Entrant[], entrant: Entrant, weighted: boolean): number {
  const total = pool.reduce((s, e) => s + (weighted ? Math.max(1, e.weight || 1) : 1), 0) || 1
  const w = weighted ? Math.max(1, entrant.weight || 1) : 1
  return (w / total) * 100
}

export function initials(name: string): string {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// "Nombre" | "Nombre, 3" | "Nombre x3"
export function parseLine(line: string): { name: string; weight: number } | null {
  let s = line.trim()
  if (!s) return null
  let weight = 1
  const m = s.match(/^(.*?)[,;]\s*(\d{1,3})\s*$/) || s.match(/^(.*?)\s*[x×]\s*(\d{1,3})\s*$/i)
  if (m) {
    s = m[1].trim()
    weight = parseInt(m[2], 10) || 1
  }
  if (!s) return null
  return { name: s, weight }
}

// Fisher–Yates shuffle with deterministic RNG
export function shuffleWith(arr: Entrant[], rng: () => number): Entrant[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Dedupe against SRT_REEL_COLORS from giveaways-util
export const SRT_COLORS = [
  "var(--accent)", "#4da3ff", "#7c5cff", "#34d377",
  "#ffb224", "#ff6f9c", "#2dd4bf", "#c084fc",
  "#f0803c", "#5b8def", "#9d7bff", "#3fc79a",
]

/**
 * Compute the pool hash — verifiable seed component
 * Identical to the string mixed in runDraw: pool.map(e => e.name + ":" + (weighted ? e.weight : 1)).join(",")
 */
export function poolHash(pool: Entrant[], weighted: boolean): string {
  const poolStr = pool.map((e) => e.name + ":" + (weighted ? e.weight : 1)).join(",")
  return hashSeed(poolStr).toString(16).toUpperCase().padStart(8, "0")
}

/**
 * Convert history rounds to CSV format
 * Header: round,seed,at,winners
 */
export function historyToCsv(rounds: HistoryRound[]): string {
  const lines: string[] = ["round,seed,at,winners"]
  for (const r of rounds) {
    const winners = r.winners.map((w) => w.name).join(" | ")
    const at = new Date(r.at).toISOString()
    lines.push(`${r.round},${r.seed},${at},"${winners.replace(/"/g, '""')}"`)
  }
  return lines.join("\n")
}

/**
 * Build shareable result text
 */
export function buildShareText(args: {
  header: string
  seedLabel: string
  hashLabel: string
  seed: string
  hash: string
  winners: string[]
}): string {
  const lines: string[] = [
    args.header,
    "",
    `${args.seedLabel} #${args.seed}`,
    `${args.hashLabel} ${args.hash}`,
    "",
    ...args.winners.map((w, i) => `${i + 1}. ${w}`),
  ]
  return lines.join("\n")
}
