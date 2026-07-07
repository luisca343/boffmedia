export type EventStatus = "active" | "upcoming" | "completed"

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
