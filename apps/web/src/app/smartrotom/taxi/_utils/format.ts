export { formatNumber as formatNum, formatMoney, timeAgo as relativeTime } from "@boffmedia/ui/format"

/** A `taxi.countdown.*` key id plus its ICU args — never copy (i18n.md §Conventions). */
export interface Countdown {
  key: "endingNow" | "minutes" | "hours" | "hoursMinutes"
  values?: Record<string, number>
}

export function countdown(minutes: number): Countdown {
  if (minutes < 1) return { key: "endingNow" }
  if (minutes < 60) return { key: "minutes", values: { minutes } }
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? { key: "hoursMinutes", values: { hours: h, minutes: m } } : { key: "hours", values: { hours: h } }
}
