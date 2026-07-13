export { formatNumber as formatNum, formatMoney, timeAgo as relativeTime } from "@/lib/format"

export function countdown(minutes: number): string {
  if (minutes < 1) return "termina ya"
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} m` : `${h} h`
}
