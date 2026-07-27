import { intlLocale } from "./locale"

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

/** Every formatter takes the viewer's locale. Omitting it falls back to the app
 *  default (`es`) so server-side and test callers stay deterministic — it is a
 *  fallback, never a licence to skip passing one from a component. Client code
 *  should use `useFormat()` (`lib/useFormat.ts`), which binds `useLocale()`. */
export type LocaleArg = string | null | undefined

export interface TimeAgoOptions {
  /** Reference "now". Pass a fixed Date to keep rendering deterministic (no
   *  hydration drift in demo/showcase data). Defaults to the real clock. */
  now?: Date | number
  /** What to render past a week. `"date"` (default) → a plain date, "12 mar".
   *  `"relative"` → keeps counting in weeks and months, "hace 2 sem.". */
  tail?: "date" | "relative"
  /** Label for the sub-minute bucket. Defaults to the locale's own "now"
   *  ("ahora" / "now"), via `Intl.RelativeTimeFormat` with `numeric: "auto"`. */
  nowLabel?: string
  /** Viewer locale. Defaults to the app default. */
  locale?: LocaleArg
}

/** Short relative time, in the viewer's language: "ahora" · "hace 4 min" ·
 *  "hace 3 h" · "hace 2 d" (en: "now" · "4 min. ago" · …), then a plain date
 *  ("12 jun") past a week. "—" when missing/unparseable. */
export function timeAgo(
  value: string | number | Date | null | undefined,
  options: TimeAgoOptions = {},
): string {
  const ms = toMs(value)
  if (!ms) return "—"
  const { now, tail = "date", nowLabel, locale } = options
  const tag = intlLocale(locale)
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "always", style: "short" })
  const diff = (now == null ? Date.now() : toMs(now)) - ms

  if (diff < MIN) {
    return nowLabel ?? new Intl.RelativeTimeFormat(tag, { numeric: "auto", style: "short" }).format(0, "second")
  }
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MIN), "minute")
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), "hour")
  const days = Math.floor(diff / DAY)
  if (days < 7) return rtf.format(-days, "day")
  if (tail === "date") return new Date(ms).toLocaleDateString(tag, { day: "numeric", month: "short" })
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week")
  return rtf.format(-Math.floor(days / 30), "month")
}

/** Long-form relative time: "hace 3 días" / "3 days ago". "" when missing. */
export function timeAgoLong(
  value: string | number | Date | null | undefined,
  locale?: LocaleArg,
): string {
  const ms = toMs(value)
  if (!ms) return ""
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "always", style: "long" })
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2592000, "week"],
    [31536000, "month"],
    [Infinity, "year"],
  ]
  let unit = 1
  for (const [limit, name] of steps) {
    if (secs < limit) return rtf.format(-Math.max(1, Math.floor(secs / unit)), name)
    unit = limit
  }
  return ""
}

/** Grouped integer in the viewer's locale: 1234 → "1.234" (es) / "1,234" (en).
 *  "—" when not finite. */
export function formatNumber(n: number, locale?: LocaleArg): string {
  if (!Number.isFinite(n)) return "—"
  // `+0` collapses -0: Math.round(-0.4) is -0, which Intl renders as "-0".
  return (Math.round(n) + 0).toLocaleString(intlLocale(locale))
}

/** The house money format, shared by StarBank and every app that shows ¥.
 *  `¥` is a fictional in-world unit, so the symbol is fixed in every locale —
 *  only grouping and separators follow the viewer. */
export function formatMoney(amount: number, locale?: LocaleArg): string {
  if (!Number.isFinite(amount)) return "— ¥"
  return `${formatNumber(amount, locale)} ¥`
}

/** Compact count in the viewer's locale: "32,4 K" (es) / "32.4 K" (en).
 *  "" when not finite. */
export function formatCompact(n: number, locale?: LocaleArg): string {
  if (!Number.isFinite(n)) return ""
  const tag = intlLocale(locale)
  const oneDecimal = (v: number) =>
    v.toLocaleString(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })
  if (n >= 1_000_000) return `${oneDecimal(n / 1_000_000)} M`
  if (n >= 1_000) return `${oneDecimal(n / 1_000)} K`
  return n.toLocaleString(tag)
}
