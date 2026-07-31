"use client"

import { useEffect, useState } from "react"
import {
  type GameVersion,
  type LoaderVersion,
  type PackLoader,
  PacksService,
} from "@/services/api/boffmedia/packsService"

// Both lists are cached on the server; this module adds a per-tab cache on top
// so reopening the modal does not re-fetch what is already in memory.

let gameCache: GameVersion[] | null = null
let gamePending: Promise<GameVersion[]> | null = null
const loaderCache = new Map<string, LoaderVersion[]>()

async function loadGameVersions(): Promise<GameVersion[]> {
  if (gameCache) return gameCache
  gamePending ??= PacksService.minecraftVersions()
    .then((res) => (res.success && res.data ? res.data : []))
    .then((list) => {
      // Only cache a real answer: caching [] would make one failed request
      // permanent for the life of the tab.
      if (list.length > 0) gameCache = list
      return list
    })
    .finally(() => {
      gamePending = null
    })
  return gamePending
}

export function useGameVersions(): { versions: GameVersion[]; loading: boolean } {
  const [versions, setVersions] = useState<GameVersion[]>(gameCache ?? [])
  const [loading, setLoading] = useState(gameCache === null)

  useEffect(() => {
    if (gameCache) return
    let live = true
    void loadGameVersions().then((list) => {
      if (!live) return
      setVersions(list)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [])

  return { versions, loading }
}

export function useLoaderVersions(
  loader: string,
  minecraft: string,
): { versions: LoaderVersion[]; loading: boolean } {
  const key = `${loader}:${minecraft}`
  const enabled = Boolean(loader && minecraft)
  const [versions, setVersions] = useState<LoaderVersion[]>(loaderCache.get(key) ?? [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setVersions([])
      return
    }
    const cached = loaderCache.get(key)
    if (cached) {
      setVersions(cached)
      return
    }
    let live = true
    setLoading(true)
    void PacksService.loaderVersions(loader as PackLoader, minecraft).then((res) => {
      const list = res.success && res.data ? res.data : []
      if (list.length > 0) loaderCache.set(key, list)
      if (!live) return
      setVersions(list)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [enabled, key, loader, minecraft])

  return { versions, loading }
}
