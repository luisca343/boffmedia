import type { IconName } from "@boffmedia/ui"

// v3 «Señal» — Calendario de lanzamientos shared types + helpers. Mirrors the
// LZ_* globals + date helpers from v3-calendario-data.jsx. All release data is
// [deferred] demo (the calendar reuses the Catálogo dataset, not wired yet).

export type LzPlatformKey = "ps5" | "xbox" | "switch" | "pc" | "mobile"

export interface LzPlatformMeta {
  label: string
  short: string
  color: string
}

// oklch tones at fixed L/C → harmonic per-platform colours.
export const LZ_PLATFORMS: Record<LzPlatformKey, LzPlatformMeta> = {
  ps5: { label: "PS5", short: "PS5", color: "oklch(0.68 0.15 256)" },
  xbox: { label: "Xbox", short: "XBX", color: "oklch(0.68 0.15 150)" },
  switch: { label: "Switch 2", short: "NSW", color: "oklch(0.68 0.15 25)" },
  pc: { label: "PC", short: "PC", color: "oklch(0.68 0.15 295)" },
  mobile: { label: "Móvil", short: "MOV", color: "oklch(0.68 0.15 200)" },
}
export const LZ_PLAT_ORDER: LzPlatformKey[] = ["ps5", "xbox", "switch", "pc", "mobile"]

export const LZ_GENRE_ICON: Record<string, IconName> = {
  RPG: "sword", Acción: "bolt", Aventura: "compass", Shooter: "target",
  Estrategia: "grid", Deportes: "trophy", Carreras: "trending", Terror: "flame",
  Plataformas: "puzzle", Simulación: "cog", Indie: "sparkles", Lucha: "shield",
  "Mundo abierto": "map", Metroidvania: "compass", Roguelike: "skull",
  Sandbox: "grid", MOBA: "crosshair", "Battle Royale": "target", Puzzle: "puzzle", Ritmo: "bolt",
}

export const LZ_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
export const LZ_WD = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
export const LZ_WD_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

export const LZ_ONE_DAY = 86400000
export const LZ_TODAY = new Date(2026, 5, 15) // 15 jun 2026 (prototype «today»)

export interface LzRelease {
  id: string | number
  title: string
  /** "YYYY-MM-DD" or null for TBA. */
  date: string | null
  hype: number
  window?: string | null
  platforms: LzPlatformKey[]
  genre: string
}

export const lzParse = (s: string) => new Date(s + "T00:00:00")
export const lzKeyOf = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
export const lzSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
export const lzAddDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const lzMondayOf = (d: Date) => lzAddDays(d, -((d.getDay() + 6) % 7))
export const lzWdShort = (d: Date) => LZ_WD_LONG[(d.getDay() + 6) % 7].slice(0, 3)
export const lzFmtDate = (d: Date) => d.getDate() + " " + LZ_MONTHS[d.getMonth()].slice(0, 3) + " " + d.getFullYear()

export function lzRelativeDays(n: number): string {
  if (n === 0) return "hoy"
  if (n === 1) return "mañana"
  if (n === -1) return "ayer"
  if (n < 0) return "hace " + Math.abs(n) + " días"
  if (n < 7) return "en " + n + " días"
  if (n < 30) {
    const w = Math.round(n / 7)
    return "en " + w + (w === 1 ? " semana" : " semanas")
  }
  const m = Math.round(n / 30)
  return "en " + m + (m === 1 ? " mes" : " meses")
}

// releases.com hierarchy: hype 5 → full banner, 4 → half banner, else poster grid.
export function lzTierOf(g?: LzRelease): "full" | "half" | "normal" {
  return !g ? "normal" : g.hype >= 5 ? "full" : g.hype === 4 ? "half" : "normal"
}

// Deterministic follower count derived from hype + an id hash (mirrors lzFollowers).
export function lzFollowers(game: LzRelease): number {
  const base = [0, 3, 9, 24, 70, 180][game.hype] || 0
  const s = String(game.id || game.title)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return base + (h % (base ? Math.round(base * 0.8) + 1 : 4))
}
