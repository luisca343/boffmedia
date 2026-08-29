"use client"

import { useEffect, useRef } from "react"

/**
 * Polls a function at regular intervals. Runs immediately when enabled,
 * then repeats every intervalMs. Guards against overlapping async runs.
 *
 * @param fn Function to poll (called sync; if async, caller owns the Promise)
 * @param intervalMs Interval in milliseconds between calls
 * @param enabled Whether polling is active; toggles start/stop
 */
export default function usePolling(fn: () => void | Promise<void>, intervalMs: number, enabled: boolean) {
  const fnRef = useRef(fn)
  const pendingRef = useRef(false)

  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return

    let mounted = true
    let interval: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      if (pendingRef.current || !mounted) return
      pendingRef.current = true
      try {
        await fnRef.current()
      } finally {
        pendingRef.current = false
      }
    }

    void poll()
    interval = setInterval(poll, intervalMs)

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [intervalMs, enabled])
}

export { usePolling }
