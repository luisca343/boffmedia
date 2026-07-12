"use client"

import { useQuery } from "@tanstack/react-query"
import {
  getChannel,
  getChannelUploads,
  getComments,
  getRelated,
  getTrending,
  getVideo,
  searchVideos,
} from "../_services/youtubeService"

export function useTrending() {
  return useQuery({ queryKey: ["yt", "trending"], queryFn: () => getTrending() })
}

export function useSearchVideos(q: string) {
  return useQuery({
    queryKey: ["yt", "search", q],
    queryFn: () => searchVideos(q),
    enabled: q.trim().length > 0,
  })
}

export function useVideo(id: string) {
  return useQuery({ queryKey: ["yt", "video", id], queryFn: () => getVideo(id), enabled: !!id })
}

export function useChannel(id: string) {
  return useQuery({ queryKey: ["yt", "channel", id], queryFn: () => getChannel(id), enabled: !!id })
}

export function useChannelUploads(id: string) {
  return useQuery({ queryKey: ["yt", "uploads", id], queryFn: () => getChannelUploads(id), enabled: !!id })
}

export function useRelated(title: string) {
  return useQuery({
    queryKey: ["yt", "related", title],
    queryFn: () => getRelated(title),
    enabled: title.trim().length > 0,
  })
}

export function useComments(videoId: string) {
  return useQuery({
    queryKey: ["yt", "comments", videoId],
    queryFn: () => getComments(videoId),
    enabled: !!videoId,
  })
}
