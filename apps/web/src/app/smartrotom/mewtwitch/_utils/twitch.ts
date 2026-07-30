import type { CategoryCardData, StreamCardData } from "@/components/smartrotom/media/ui"
import type { TwitchGame, TwitchStream } from "../types"

export const MEWTWITCH_BASE = "/smartrotom/mewtwitch"

/** Twitch image URLs carry {width}/{height} placeholders — fill them in. */
export function twitchThumb(url: string | undefined, w = 640, h = 360): string {
  if (!url) return ""
  return url.replace("{width}", String(w)).replace("{height}", String(h))
}

/** "3h 24m" / "42m" since the stream started. */
export function uptimeFrom(startedAt?: string): string {
  if (!startedAt) return ""
  const start = new Date(startedAt).getTime()
  if (Number.isNaN(start)) return ""
  const mins = Math.max(0, Math.floor((Date.now() - start) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Spanish compact count: "32,4 K" · "1,2 M".
export { formatCompact as compactCount } from "@boffmedia/ui/format"

export function toStreamCard(s: TwitchStream): StreamCardData {
  return {
    href: `${MEWTWITCH_BASE}/stream/${s.user_login}`,
    thumb: twitchThumb(s.thumbnail_url, 640, 360),
    title: s.title,
    streamer: s.user_name,
    game: s.game_name,
    viewers: s.viewer_count,
    tags: s.tags?.slice(0, 3),
  }
}

export function toCategoryCard(g: TwitchGame): CategoryCardData {
  return {
    href: `${MEWTWITCH_BASE}/game/${g.id}`,
    art: twitchThumb(g.box_art_url, 220, 300),
    name: g.name,
    // Twitch's top-games endpoint carries no viewer/stream counts → gated (§13)
  }
}
