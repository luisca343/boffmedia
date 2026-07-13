"use client"

import { useEffect, useState } from "react"

/** Subscribes to a media query. `false` until mounted, so SSR and first paint agree. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [query])

  return matches
}

/** Wide enough for the map and the panel to sit side by side. */
export const useWide = () => useMediaQuery("(min-width: 980px)")

/**
 * Viewport height, or 0 before mount.
 *
 * Reading `window.innerHeight` during render would hydrate differently than it
 * server-rendered (the server has no window, the client has a real height), and the
 * mismatch lands on a `style` attribute — React would patch it and warn. Zero until
 * mounted means the first client render matches the server's exactly.
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const sync = () => setHeight(window.innerHeight)
    sync()
    window.addEventListener("resize", sync)
    return () => window.removeEventListener("resize", sync)
  }, [])

  return height
}

/**
 * The OS "reduce motion" preference. The CSS animations already honour it via
 * `motion-reduce:`, but the map's camera flights are JS and have to ask.
 */
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)")
