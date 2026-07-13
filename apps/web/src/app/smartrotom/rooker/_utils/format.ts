/** Spanish number + time formatting for the timeline. */

/**
 * Counts, abbreviated the Spanish way: 1.284 → "1.284", 12 400 → "12,4 mil",
 * 1 200 000 → "1,2 M". The comma is the decimal separator and the dot the thousands
 * separator — the inverse of the English convention, and the reason this is not
 * `Intl.NumberFormat` with `notation: "compact"` (which renders "12 mil" and drops
 * the tenth that makes a count feel precise).
 */
export function fmt(n: number | undefined | null): string {
  if (n == null) return "0"
  if (n < 1000) return String(n)
  if (n < 1e6) {
    const v = n / 1000
    const s = v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace(".0", "").replace(".", ",")
    return `${s} mil`
  }
  return `${(n / 1e6).toFixed(1).replace(".0", "").replace(".", ",")} M`
}

/** The dot-separated thousands used for exact figures (followers, a stat tile). */
export function exact(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("es-ES")
}

/**
 * "12 min", "3 h", "2 d" — the terse relative stamp a post carries in the timeline.
 * Past a week it becomes an absolute date, because "63 d" tells the reader nothing.
 */
export function relTime(iso: string | Date | null | undefined): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))

  if (secs < 60) return "ahora"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`

  const d = new Date(then)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    ...(sameYear ? null : { year: "numeric" }),
  })
}

/** The long stamp on a post's detail view: "13 jul 2026 · 14:32". */
export function fullTime(iso: string | Date | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const date = d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  return `${date} · ${time}`
}

/** "Se unió en mar. 2024". */
export function joinedAt(iso: string | Date | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `Se unió en ${d.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`
}
