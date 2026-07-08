"use client"

import { useEffect, useRef, useState } from "react"

/** True while the viewport is at or below `px` wide (drives master→detail drill-in). */
export function useDkNarrow(px: number): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`)
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [px])
  return narrow
}

/**
 * Brief loading pulse whenever `deps` change (after first render) — used to show
 * datakit skeletons on a context switch even when the data itself is cached.
 * Prefer a real fetch `loading` flag when one exists; OR it with this.
 */
export function useDkLoad(deps: React.DependencyList, ms = 260): boolean {
  const [loading, setLoading] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setLoading(true)
    const id = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return loading
}
