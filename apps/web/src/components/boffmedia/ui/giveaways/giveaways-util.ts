import type { IconName } from "@/components/boffmedia/primitives"
import { intlLocale } from "@/lib/locale"

// v3 «Señal» — Sorteos (giveaways) shared types + helpers. Mirrors the window
// helpers from v3-sorteos-data.jsx (srtStatus/srtHue/srtNum/srtOdds…). The
// platform is a transparent, weighted raffle tool (community · Twitch viewers ·
// manual list). All data is [deferred] demo until a giveaways API exists.

export type SrtPrizeType = "key" | "item" | "merch" | "nitro" | "pass" | "cash"
export type SrtSourceKey = "comunidad" | "twitch" | "manual"
export type SrtStatusKey = "upcoming" | "active" | "ended" | "announced"

export interface SrtParticipant {
  name: string
  avatar: string
  tickets: number
}

export interface SrtPrize {
  name: string
  type: SrtPrizeType
  value: number
  winners: number
  items: { name: string; qty: number }[]
}

export interface SrtRequirement {
  icon: IconName
  label: string
  met: boolean
}
export interface SrtStep {
  label: string
  done: boolean
}
export interface SrtOrganizerData {
  name: string
  handle?: string
  kind: "boffmedia" | "streamer" | "comunidad"
  avatar: string
}

export interface Sorteo {
  id: number
  slug: string
  title: string
  description: string
  featured?: boolean
  gameId?: number | null
  source: SrtSourceKey
  organizer: SrtOrganizerData
  prize: SrtPrize
  startDate: string
  endDate: string
  region?: string
  minLevel?: number | null
  entrants: number
  cap?: number | null
  requirements: SrtRequirement[]
  steps: SrtStep[]
  rules: string[]
  seed?: number
  /** [deferred] resolved per-game hue (CSS colour); falls back to the brand accent. */
  hue?: string | null
  participants: SrtParticipant[]
  winner?: SrtParticipant | null
}

export interface SrtStatus {
  key: SrtStatusKey
  tone: string
}

// Labels/descriptions live in locales/{es,en}/common.json under
// common.giveaways.prize / .source / .status, keyed by these same type/key
// values — components resolve them with t(`prize.${type}.label`) etc.
export const SRT_PRIZE: Record<SrtPrizeType, { icon: IconName }> = {
  key: { icon: "key" },
  item: { icon: "gift" },
  merch: { icon: "shield" },
  nitro: { icon: "sparkles" },
  pass: { icon: "trophy" },
  cash: { icon: "star" },
}

export const SRT_SOURCE: Record<SrtSourceKey, { icon: IconName }> = {
  comunidad: { icon: "users" },
  twitch: { icon: "message" },
  manual: { icon: "list" },
}

// Weighted-reel segment colours (mirrors SRT_REEL_COLORS).
export const SRT_REEL_COLORS = ["var(--accent)", "#4da3ff", "#7c5cff", "#34d377", "#ffb224", "#ff6f9c", "#2dd4bf", "#c084fc"]

// Fixed reference «now» so lifecycle status is deterministic (demo data). [deferred]
export const SRT_NOW = new Date("2026-07-09T12:00:00")

export function srtStatus(g: Sorteo, now: Date = SRT_NOW): SrtStatus {
  const s = new Date(g.startDate).getTime()
  const e = new Date(g.endDate).getTime()
  const t = now.getTime()
  if (g.winner) return { key: "announced", tone: "accent" }
  if (t < s) return { key: "upcoming", tone: "info" }
  if (t > e) return { key: "ended", tone: "muted" }
  return { key: "active", tone: "live" }
}

export function srtHue(g: Sorteo): string {
  return g.hue || "var(--accent)"
}

export function srtNum(n?: number | null, locale?: string | null): string {
  return (n || 0).toLocaleString(intlLocale(locale))
}

export function srtPrizeMeta(type: SrtPrizeType) {
  return SRT_PRIZE[type] || SRT_PRIZE.item
}
export function srtSourceMeta(src: SrtSourceKey) {
  return SRT_SOURCE[src] || SRT_SOURCE.comunidad
}

export function srtTotalTickets(g: Sorteo): number {
  return (g.participants || []).reduce((a, p) => a + p.tickets, 0)
}

export function srtOdds(g: Sorteo, tickets: number): number {
  const total = srtTotalTickets(g) + tickets
  if (total <= 0) return 0
  return (tickets / total) * 100
}
