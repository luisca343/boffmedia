// Deliberately local rather than from @boffmedia/ui's useFormat: that hook is
// bound to the host's locale provider, which the launcher does not have yet.
// When the launcher grows i18n, these collapse into configureUi().

const LOCALE = "es-ES"

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"
  const mins = Math.round((Date.now() - then) / 60_000)
  if (mins < 1) return "hace un momento"
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `hace ${days} d`
  return new Date(then).toLocaleDateString(LOCALE)
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString(LOCALE, { hour12: false })
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Cumulative playtime, rounded to whole minutes/hours. Unlike `formatDuration`
 *  (a running H:MM:SS clock), this reads as a summary: "12 h 34 min", "45 min".
 *  Anything under a minute is "< 1 min" rather than "0 min", so a pack launched
 *  once never looks like it was never played. */
export function formatPlaytime(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return "< 1 min"
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h < 1) return `${m} min`
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}
