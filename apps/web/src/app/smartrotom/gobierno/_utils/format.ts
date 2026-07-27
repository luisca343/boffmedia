export { timeAgo } from "@/lib/format"
import { intlLocale } from "@/lib/locale"

export const money = (n: number | null | undefined, locale?: string | null): string =>
  Number(n ?? 0).toLocaleString(intlLocale(locale))

export const fmtDate = (iso: string | Date | null | undefined, locale?: string | null): string => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(intlLocale(locale), { day: "2-digit", month: "short", year: "numeric" })
}

export const fmtDateTime = (iso: string | Date | null | undefined, locale?: string | null): string => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(intlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

// "Termina en 4 h 25 min" — an auction or a hunt is only legible as time remaining.
// `finishedLabel` is the caller's translated copy for a deadline already past; the unit
// abbreviations are the same in both locales.
export const timeLeft = (iso: string | Date | null | undefined, finishedLabel = "—"): string => {
  if (!iso) return "—"
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms)) return "—"
  if (ms <= 0) return finishedLabel
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

// Towns arrive from WorldGuard as snake_case region prefixes (`ciudad_carmin`).
export const townName = (raw: string | null | undefined): string => {
  if (!raw) return "—"
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// The badge number is derived from the user id, not stored — there is no officers table.
export const badgeOf = (userId: number | null | undefined, prefix = "G"): string =>
  `${prefix}-${String(userId ?? 0).padStart(3, "0")}`
