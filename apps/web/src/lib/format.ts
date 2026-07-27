const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/** ISO/string/number/Date → epoch ms; 0 when null or unparseable. */
export function toMs(value: string | number | Date | null | undefined): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
}

export interface TimeAgoOptions {
  /** Reference "now". Pass a fixed Date to keep rendering deterministic (no
   *  hydration drift in demo/showcase data). Defaults to the real clock. */
  now?: Date | number
  /** What to render past a week. `"date"` (default) → a plain date, "12 mar".
   *  `"relative"` → keeps counting in weeks and months, "hace 2 sem". */
  tail?: "date" | "relative"
  /** Label for the sub-minute bucket. Defaults to "ahora". */
  nowLabel?: string
}

/** Short Spanish relative time: "ahora" · "hace 4 min" · "hace 3 h" · "hace 2 d",
 *  then a plain date ("12 mar") past a week. "—" when missing/unparseable. */
export function timeAgo(
  value: string | number | Date | null | undefined,
  options: TimeAgoOptions = {},
): string {
  const ms = toMs(value)
  if (!ms) return "—"
  const { now, tail = "date", nowLabel = "ahora" } = options
  const diff = (now == null ? Date.now() : toMs(now)) - ms
  if (diff < MIN) return nowLabel
  if (diff < HOUR) return `hace ${Math.floor(diff / MIN)} min`
  if (diff < DAY) return `hace ${Math.floor(diff / HOUR)} h`
  const days = Math.floor(diff / DAY)
  if (days < 7) return `hace ${days} d`
  if (tail === "date") return new Date(ms).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? "es" : ""}`
}

/** Long-form Spanish relative time: "hace 3 días" · "hace 2 semanas". "" when missing. */
export function timeAgoLong(value: string | number | Date | null | undefined): string {
  const ms = toMs(value)
  if (!ms) return ""
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  const steps: [number, string, string][] = [
    [60, "segundo", "segundos"],
    [3600, "minuto", "minutos"],
    [86400, "hora", "horas"],
    [604800, "día", "días"],
    [2592000, "semana", "semanas"],
    [31536000, "mes", "meses"],
    [Infinity, "año", "años"],
  ]
  let unit = 1
  for (const [limit, sing, plur] of steps) {
    if (secs < limit) {
      const n = Math.max(1, Math.floor(secs / unit))
      return `hace ${n} ${n === 1 ? sing : plur}`
    }
    unit = limit
  }
  return ""
}

/** Grouped integer, es-ES: 1234 → "1.234". "—" when not finite. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—"
  // `+0` collapses -0: Math.round(-0.4) is -0, which Intl renders as "-0".
  return (Math.round(n) + 0).toLocaleString("es-ES")
}

/** The house money format, shared by StarBank and every app that shows ¥: "1.234 ¥". */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "— ¥"
  return `${formatNumber(amount)} ¥`
}

/** Spanish compact count: "32,4 K" · "1,2 M". "" when not finite. */
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return ""
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")} K`
  return n.toLocaleString("es-ES")
}
