import type { Video } from "../types"
import type { VideoCardData } from "@/components/smartrotom/media/ui"
import { timeAgoLong as relativeTime } from "@boffmedia/ui/format"
import { intlLocale } from "@boffmedia/ui/locale"

export const MEWTUBE_BASE = "/smartrotom/mewtube"

/** Resolve a video id across the search/videos/playlistItem shapes. */
export function videoIdOf(v: Video): string {
  if (typeof v.id === "string") return v.id
  return v.id?.videoId ?? v.snippet.resourceId?.videoId ?? ""
}

export function thumbOf(v: Video): string | undefined {
  const t = v.snippet.thumbnails
  return t.high?.url ?? t.medium?.url ?? t.default?.url
}

/** Locale-aware compact count: "1,2 M" (es) / "1.2 M" (en) · "248 K" · "812". */
export function formatCount(raw?: string | number, locale?: string | null): string {
  const n = typeof raw === "number" ? raw : parseInt(raw ?? "", 10)
  if (!Number.isFinite(n)) return ""
  const tag = intlLocale(locale)
  if (n >= 1_000_000) {
    const millions = (n / 1_000_000).toLocaleString(tag, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: false,
    })
    return `${millions} M`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} K`
  return n.toLocaleString(tag)
}

/** ISO8601 duration (PT1H2M30S) → "1:02:30" / "27:14". */
export function formatDuration(iso?: string): string | undefined {
  if (!iso) return undefined
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return undefined
  const h = +(m[1] ?? 0)
  const min = +(m[2] ?? 0)
  const s = +(m[3] ?? 0)
  const pad = (x: number) => x.toString().padStart(2, "0")
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`
}

// Long-form relative time, locale-aware: "hace 3 días" / "3 days ago".
export { relativeTime }

/** Map a YouTube video to VideoCard props. Duration/views present only when the
 *  source part was requested (search results are enriched separately). */
export function toVideoCard(
  v: Video,
  opts?: { creatorAvatar?: string; locale?: string | null },
): VideoCardData {
  return {
    href: `${MEWTUBE_BASE}/video/${videoIdOf(v)}`,
    thumb: thumbOf(v),
    title: v.snippet.title,
    duration: formatDuration((v as { contentDetails?: { duration?: string } }).contentDetails?.duration),
    creator: v.snippet.channelTitle,
    creatorAvatar: opts?.creatorAvatar,
    views: v.statistics ? formatCount(v.statistics.viewCount, opts?.locale) : "",
    age: relativeTime(v.snippet.publishedAt, opts?.locale),
  }
}
