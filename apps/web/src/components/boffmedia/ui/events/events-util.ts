import { intlLocale } from "@/lib/locale"

export type EventStatus = "active" | "upcoming" | "completed"

/** Who runs the event and what role Boffmedia plays. */
export type EventOrganizerRole = "boffmedia" | "coorg" | "platform"
export interface EventOrganizerData {
  role: EventOrganizerRole
  name: string
  avatar?: string
  handle?: string
}

export interface EventLike {
  id: number
  title: string
  description?: string | null
  gameId?: number
  gameName?: string | null
  icon?: string | null
  banner?: string | null
  startDate: string
  endDate?: string | null
  status?: string | null
  type?: string | null
  // ── Fields the events API does NOT provide yet — optional + deferred. ────────
  // Populated only in the showcase (demo data). On real pages they are absent and
  // every consumer must degrade gracefully. Remove the "[deferred]" note once the
  // backend/DTO exposes them. See docs/BOFFMEDIA_V3_DEFERRED.md.
  /** [deferred] Participant count — the list endpoint has none (detail fetches participants separately). */
  participants?: number | null
  /** [deferred] Organizer — not in the event model at all. */
  organizer?: EventOrganizerData | null
  /** [deferred] Per-game hue (CSS colour) — no game→hue field on the DTO; falls back to the brand accent. */
  hue?: string | null
}

export const EV_BOFF = { name: "Boffmedia", avatar: "B", handle: "@boffmedia" } as const

// Rarity palette shared by achievements + the RarityTag atom (color · soft bg).
// The label lives in `logros.rarity.*` — resolve with useTranslations, not here.
export const RARITY: Record<string, { color: string; soft: string }> = {
  bronze: { color: "#cd7f47", soft: "rgba(205,127,71,0.14)" },
  silver: { color: "#c0c7d1", soft: "rgba(192,199,209,0.16)" },
  gold: { color: "#f4b04e", soft: "rgba(244,176,78,0.16)" },
  platinum: { color: "#5fd6c4", soft: "rgba(95,214,196,0.16)" },
  diamond: { color: "#7cc4ff", soft: "rgba(124,196,255,0.18)" },
}

/** Per-game hue in the events' `hsl(H 62% 58%)` formula. [deferred] until games API carries hue. */
export function evHue(hue?: number | string | null): string {
  if (hue == null) return "var(--accent)"
  return typeof hue === "number" ? `hsl(${hue} 62% 58%)` : hue
}

/** Locale-aware thousands formatting for point/participant counts. */
export function evNum(n?: number | null, locale?: string | null): string {
  return (n || 0).toLocaleString(intlLocale(locale))
}

/**
 * A player row on a leaderboard. Sourced from the (future) ranking API.
 * [deferred] — no ranking endpoint yet; the showcase feeds demo rows.
 */
export interface PlayerLike {
  userId: number
  nickname: string
  avatar: string
  totalPoints: number
  medalCount: number
  achievementCount: number
  /** [deferred] short game code shown in the leaderboard's game column. */
  gameShort?: string | null
  /** [deferred] per-game hue (CSS colour or HSL hue number). */
  hue?: number | string | null
}

/** Label · tag · icon per organizer role (used by the block variant). */
export function evOrgMeta(role: EventOrganizerRole) {
  // `*Key` fields, not literals — resolving with t() at module scope would freeze
  // whichever locale loaded first. Callers resolve against `events.organizer`.
  const map = {
    boffmedia: { role: "boffmedia", labelKey: "labelBoffmedia", tagKey: "tagOfficial", icon: "shield" },
    coorg: { role: "coorg", labelKey: "labelCoorg", tagKey: "tagCoorg", icon: "users" },
    platform: { role: "platform", labelKey: "labelPlatform", tagKey: "tagCommunity", icon: "globe" },
  } as const
  return map[role] ?? map.boffmedia
}

/** Events default to «organized by Boffmedia» when no organizer is set. */
export function evOrg(event: EventLike): EventOrganizerData {
  return event.organizer ?? { role: "boffmedia", name: EV_BOFF.name, avatar: EV_BOFF.avatar, handle: EV_BOFF.handle }
}

/** Prefer the server status; fall back to date math if it's absent. */
export function eventStatus(e: EventLike): EventStatus {
  const s = (e.status || "").toLowerCase()
  if (s === "active" || s === "upcoming" || s === "completed") return s
  const now = Date.now()
  const start = new Date(e.startDate).getTime()
  const end = e.endDate ? new Date(e.endDate).getTime() : NaN
  if (!Number.isNaN(start) && now < start) return "upcoming"
  if (!Number.isNaN(end) && now > end) return "completed"
  return "active"
}

export function formatEventDate(iso?: string | null, locale?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" })
}

/** `{ d: "14", m: "JUL" }` for the compact date block. */
export function dayMonth(iso?: string | null, locale?: string | null): { d: string; m: string } {
  if (!iso) return { d: "–", m: "" }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { d: "–", m: "" }
  return {
    d: String(d.getDate()),
    m: d.toLocaleDateString(intlLocale(locale), { month: "short" }).replace(".", "").toUpperCase(),
  }
}
