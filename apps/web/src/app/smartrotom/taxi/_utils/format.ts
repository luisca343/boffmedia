/** Grouped integer, no currency. */
export function formatNum(n: number): number | string {
  if (!Number.isFinite(n)) return "—"
  return Math.round(n).toLocaleString("es-ES")
}

/** The house money format, shared with StarBank: `1.234 ¥`. */
export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "— ¥"
  return `${Math.round(amount).toLocaleString("es-ES")} ¥`
}

export function relativeTime(ts: number): string {
  const minutes = Math.round((Date.now() - ts) / 60000)
  if (minutes < 1) return "ahora mismo"
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}

export function countdown(minutes: number): string {
  if (minutes < 1) return "termina ya"
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} m` : `${h} h`
}
