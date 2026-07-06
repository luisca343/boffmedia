"use client"

import { useCallback, useSyncExternalStore } from "react"

function makeStore(key: string, def: string[]) {
  let val: string[] = def
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (raw) val = JSON.parse(raw)
  } catch {}
  const subs = new Set<() => void>()

  return {
    get: () => val,
    set: (v: string[]) => {
      val = v
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {}
      subs.forEach((f) => f())
    },
    sub: (f: () => void) => {
      subs.add(f)
      return () => subs.delete(f)
    },
  }
}

const FAV_STORE = makeStore("boff-tool-favs", [])
const RECENT_STORE = makeStore("boff-tool-recent", [])

function useStore(store: ReturnType<typeof makeStore>) {
  return useSyncExternalStore(store.sub, store.get, store.get)
}

export function useFavorites() {
  const favs = useStore(FAV_STORE)
  const isFav = useCallback((href: string) => favs.includes(href), [favs])
  const toggle = useCallback((href: string) => {
    const f = FAV_STORE.get()
    FAV_STORE.set(f.includes(href) ? f.filter((x) => x !== href) : [...f, href])
  }, [])
  return { favs, isFav, toggle }
}

export function useRecent() {
  const recent = useStore(RECENT_STORE)
  const push = useCallback((href: string) => {
    const r = RECENT_STORE.get()
    RECENT_STORE.set([href, ...r.filter((x) => x !== href)].slice(0, 10))
  }, [])
  return { recent, push }
}
