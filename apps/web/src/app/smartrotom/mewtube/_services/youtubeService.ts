import { mediaFetch } from "@/components/smartrotom/media/MediaQueryProvider"
import type { Video, ChannelInfo } from "../types"
import { videoIdOf } from "../_utils/youtube"

interface YtList<T> {
  items?: T[]
}

function ytUrl(resource: string, params: Record<string, string>): string {
  const sp = new URLSearchParams({ resource, ...params })
  return `/api/youtube?${sp.toString()}`
}

/** Most-popular videos (rich: snippet + statistics + duration). */
export async function getTrending(regionCode = "ES", maxResults = 12): Promise<Video[]> {
  const data = await mediaFetch<YtList<Video>>(
    ytUrl("videos", {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      maxResults: String(maxResults),
      regionCode,
    }),
  )
  return data.items ?? []
}

/** Search, then enrich the hits with stats + duration (two calls). */
export async function searchVideos(q: string, maxResults = 24): Promise<Video[]> {
  const search = await mediaFetch<YtList<Video>>(
    ytUrl("search", { part: "snippet", q, maxResults: String(maxResults), type: "video" }),
  )
  const items = search.items ?? []
  const ids = items.map(videoIdOf).filter(Boolean)
  if (ids.length === 0) return items
  const details = await mediaFetch<YtList<Video>>(
    ytUrl("videos", { part: "snippet,statistics,contentDetails", id: ids.join(",") }),
  )
  return details.items ?? items
}

export async function getVideo(id: string): Promise<Video | null> {
  const data = await mediaFetch<YtList<Video>>(
    ytUrl("videos", { part: "snippet,statistics,contentDetails", id }),
  )
  return data.items?.[0] ?? null
}

export async function getChannel(id: string): Promise<ChannelInfo | null> {
  const data = await mediaFetch<YtList<ChannelInfo>>(
    ytUrl("channels", { part: "snippet,statistics,brandingSettings", id }),
  )
  return data.items?.[0] ?? null
}

/** A channel's latest uploads (via its uploads playlist). */
export async function getChannelUploads(id: string, maxResults = 24): Promise<Video[]> {
  const meta = await mediaFetch<YtList<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }>>(
    ytUrl("channels", { part: "contentDetails", id }),
  )
  const playlistId = meta.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) return []
  const data = await mediaFetch<YtList<Video>>(
    ytUrl("playlistItems", { part: "snippet,contentDetails", playlistId, maxResults: String(maxResults) }),
  )
  return data.items ?? []
}

/** Related videos for the up-next rail (search by the video's title). */
export async function getRelated(title: string, maxResults = 12): Promise<Video[]> {
  return searchVideos(title, maxResults)
}

export interface YtComment {
  id: string
  author: string
  authorAvatar?: string
  text: string
  likes: number
  publishedAt: string
  replyCount: number
}

/** Top comments for a video (real, via commentThreads). Empty if disabled. */
export async function getComments(videoId: string, maxResults = 20): Promise<YtComment[]> {
  try {
    const data = await mediaFetch<{
      items?: Array<{
        id: string
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: string
              authorProfileImageUrl?: string
              textOriginal?: string
              textDisplay: string
              likeCount: number
              publishedAt: string
            }
          }
          totalReplyCount: number
        }
      }>
    }>(
      ytUrl("commentThreads", {
        part: "snippet",
        videoId,
        maxResults: String(maxResults),
        order: "relevance",
      }),
    )
    return (data.items ?? []).map((it) => {
      const c = it.snippet.topLevelComment.snippet
      return {
        id: it.id,
        author: c.authorDisplayName,
        authorAvatar: c.authorProfileImageUrl,
        text: c.textOriginal ?? c.textDisplay,
        likes: c.likeCount,
        publishedAt: c.publishedAt,
        replyCount: it.snippet.totalReplyCount,
      }
    })
  } catch {
    // comments disabled on the video, or quota — degrade gracefully
    return []
  }
}
