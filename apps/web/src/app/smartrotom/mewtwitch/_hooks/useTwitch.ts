"use client"

import { useQuery } from "@tanstack/react-query"
import { twitchAPI } from "../_services/twitchAPI"

export function useTopStreams() {
  return useQuery({ queryKey: ["tw", "top-streams"], queryFn: () => twitchAPI.getTopStreams(24) })
}

export function useTopGames() {
  return useQuery({ queryKey: ["tw", "top-games"], queryFn: () => twitchAPI.getTopGames(12) })
}

export function useSearchStreams(q: string) {
  return useQuery({
    queryKey: ["tw", "search", q],
    queryFn: () => twitchAPI.searchStreams(q, 24),
    enabled: q.trim().length > 0,
  })
}

export function useStreamByUser(login: string) {
  return useQuery({ queryKey: ["tw", "stream", login], queryFn: () => twitchAPI.getStreamByUsername(login), enabled: !!login })
}

export function useUser(username: string) {
  return useQuery({ queryKey: ["tw", "user", username], queryFn: () => twitchAPI.getUserByUsername(username), enabled: !!username })
}

export function useGame(id: string) {
  return useQuery({ queryKey: ["tw", "game", id], queryFn: () => twitchAPI.getGameById(id), enabled: !!id })
}

export function useStreamsForGame(id: string) {
  return useQuery({ queryKey: ["tw", "game-streams", id], queryFn: () => twitchAPI.getStreamsForGame(id, 24), enabled: !!id })
}

export function useUserVideos(userId: string) {
  return useQuery({ queryKey: ["tw", "user-videos", userId], queryFn: () => twitchAPI.getUserVideos(userId, 12), enabled: !!userId })
}

export function useUserClips(broadcasterId: string) {
  return useQuery({ queryKey: ["tw", "user-clips", broadcasterId], queryFn: () => twitchAPI.getUserClips(broadcasterId, 12), enabled: !!broadcasterId })
}

export function useClip(id: string) {
  return useQuery({ queryKey: ["tw", "clip", id], queryFn: () => twitchAPI.getClipById(id), enabled: !!id })
}

export function useVideo(id: string) {
  return useQuery({ queryKey: ["tw", "video", id], queryFn: () => twitchAPI.getVideoById(id), enabled: !!id })
}

export function useFollowerCount(userId: string) {
  return useQuery({ queryKey: ["tw", "followers", userId], queryFn: () => twitchAPI.getFollowerCount(userId), enabled: !!userId })
}
