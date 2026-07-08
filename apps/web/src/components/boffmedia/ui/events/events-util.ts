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

/** Label · tag · icon per organizer role (used by the block variant). */
export function evOrgMeta(role: EventOrganizerRole) {
  const map = {
    boffmedia: { role: "boffmedia", label: "Organiza Boffmedia", tag: "Oficial", icon: "shield" },
    coorg: { role: "coorg", label: "Co-organizado", tag: "Co-org", icon: "users" },
    platform: { role: "platform", label: "En la plataforma", tag: "Comunidad", icon: "globe" },
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

export function formatEventDate(iso?: string | null, locale = "es-ES"): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

/** `{ d: "14", m: "JUL" }` for the compact date block. */
export function dayMonth(iso?: string | null, locale = "es-ES"): { d: string; m: string } {
  if (!iso) return { d: "–", m: "" }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { d: "–", m: "" }
  return {
    d: String(d.getDate()),
    m: d.toLocaleDateString(locale, { month: "short" }).replace(".", "").toUpperCase(),
  }
}
