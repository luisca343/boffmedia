import type * as React from "react"

// Inline CSS custom properties (--tc etc.) — @types/react rejects `--x` keys on
// style objects, so route them through one localized cast (mirrors the calc kit).
export function cssVars(vars: Record<string, string | number | undefined>): React.CSSProperties {
  return vars as unknown as React.CSSProperties
}

// ── Types ──────────────────────────────────────────────────────────────────
// Card types arrive English-keyed from the API (tcgdex). We normalise to a
// lowercase key, colour them canonically, and label them through next-intl in
// the views (`vgc`-style namespace) rather than baking Spanish here.
export const TYPE_COLORS: Record<string, string> = {
  grass: "#3fa129", fire: "#e62829", water: "#2980ef", lightning: "#fac000",
  psychic: "#ef4179", fighting: "#ff8000", darkness: "#5a5366", metal: "#60a1b8",
  dragon: "#5060e1", colorless: "#9fa19f", fairy: "#ef70ef",
}

// Aliases so "electric"/"dark"/"steel" resolve too.
const TYPE_ALIAS: Record<string, string> = {
  electric: "lightning", dark: "darkness", steel: "metal", normal: "colorless",
}

export function normType(type: string | undefined | null): string {
  if (!type) return "colorless"
  const k = type.toLowerCase().trim()
  return TYPE_ALIAS[k] || k
}

export function typeColor(type: string | undefined | null): string {
  return TYPE_COLORS[normType(type)] ?? "var(--dim)"
}

// Signal glyph per type — mirrors the handoff «cara señal» art window.
const TYPE_GLYPH: Record<string, string> = {
  grass: "✦", fire: "✸", water: "❍", lightning: "⚡", psychic: "◈",
  fighting: "✜", darkness: "☾", metal: "⬡", dragon: "❈", colorless: "○", fairy: "✿",
}

export function typeGlyph(type: string | undefined | null): string {
  return TYPE_GLYPH[normType(type)] ?? "○"
}

// ── Stage ──────────────────────────────────────────────────────────────────
// tcgdex returns "Basic" / "Stage1" / "Stage2"; normalise for the i18n key
// (`app.stage.<key>`) shown on the card frame. Unknown → "basic" (Básica).
export function normStage(stage: string | undefined | null): string {
  const k = (stage || "").toLowerCase().replace(/\s+/g, "")
  if (k.includes("2")) return "stage2"
  if (k.includes("1")) return "stage1"
  return "basic"
}

// The canonical order used for the filter chip row.
export const TYPE_ORDER = [
  "grass", "fire", "water", "lightning", "psychic",
  "fighting", "darkness", "metal", "dragon", "fairy",
]

// ── Rarity ─────────────────────────────────────────────────────────────────
// Pocket rarities read like "One Diamond" / "Three Star" / "Crown". We parse
// the raw string into a display kind (diamond ◆ / star ★ / crown ♛), a mark
// count, and a sort order so lists can rank by rarity.
export type RarityKind = "diamond" | "star" | "crown"
export interface RarityMeta {
  kind: RarityKind
  n: number
  order: number
  raw: string
}

const WORD_N: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 }

export function rarityMeta(raw: string | undefined | null): RarityMeta {
  const r = (raw || "").toLowerCase().trim()
  if (!r) return { kind: "diamond", n: 1, order: 0, raw: raw || "" }

  if (r.includes("crown")) return { kind: "crown", n: 1, order: 90, raw: raw! }

  const words = r.split(/\s+/)
  const count = words.map((w) => WORD_N[w]).find((n) => n != null) ?? 1

  if (r.includes("star") || r.includes("shiny") || r.includes("immersive")) {
    return { kind: "star", n: count, order: 60 + count, raw: raw! }
  }
  // Everything else (One/Two/Three/Four Diamond, Common, Uncommon, Rare…).
  const legacy: Record<string, number> = { common: 1, uncommon: 2, rare: 3 }
  const n = r.includes("diamond") ? count : (legacy[words[0]] ?? 1)
  return { kind: "diamond", n, order: n, raw: raw! }
}

// ── Category / stage ─────────────────────────────────────────────────────────
export function isPokemon(card: { category?: string }): boolean {
  return (card.category || "").toLowerCase() === "pokemon"
}

// ── Formatting ───────────────────────────────────────────────────────────────
export function pct(v: number): string {
  const p = v * 100
  if (p === 0) return "—"
  if (p >= 10) return p.toFixed(1) + "%"
  if (p >= 1) return p.toFixed(2) + "%"
  return p.toFixed(3) + "%"
}

export function padNum(n: string | number): string {
  const s = String(n).replace(/\D/g, "")
  return s.padStart(3, "0")
}

export function timeAgo(iso: string, locale: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (mins < 60) return rtf.format(-mins, "minute")
  const h = Math.round(mins / 60)
  if (h < 24) return rtf.format(-h, "hour")
  const days = Math.round(h / 24)
  if (days <= 7) return rtf.format(-days, "day")
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short" })
}

// Local self-hosted art path (falls back to the API `image` URL, then a CSS
// placeholder) — see TcgCardArt in the kit.
export function localCardArt(setId: string, id: string): string {
  return `/assets/img/games/tcgpocket/cards/${setId}/${id}.jpg`
}
