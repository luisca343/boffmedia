import type { Video } from "../types"
import type { VideoCardData } from "@/components/smartrotom/media/ui"
import { timeAgoLong as relativeTime } from "@/lib/format"

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

/** Spanish count: "1,2 M" · "248 K" · "812". */
export function formatCount(raw?: string | number): string {
  const n = typeof raw === "number" ? raw : parseInt(raw ?? "", 10)
  if (!Number.isFinite(n)) return ""
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`
  if (n >= 1_000) return `${Math.round(n / 1_000)} K`
  return n.toLocaleString("es-ES")
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

// Long-form Spanish relative time: "hace 3 días".
export { relativeTime }

/** Map a YouTube video to VideoCard props. Duration/views present only when the
 *  source part was requested (search results are enriched separately). */
export function toVideoCard(v: Video, opts?: { creatorAvatar?: string }): VideoCardData {
  return {
    href: `${MEWTUBE_BASE}/video/${videoIdOf(v)}`,
    thumb: thumbOf(v),
    title: v.snippet.title,
    duration: formatDuration((v as { contentDetails?: { duration?: string } }).contentDetails?.duration),
    creator: v.snippet.channelTitle,
    creatorAvatar: opts?.creatorAvatar,
    views: v.statistics ? formatCount(v.statistics.viewCount) : "",
    age: relativeTime(v.snippet.publishedAt),
  }
}
