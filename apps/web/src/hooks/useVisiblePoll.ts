"use client"

import { useEffect, useRef } from "react"

/**
 * Run `fn` every `intervalMs` while the tab is visible.
 *
 * The tournament pages keep three independent polls open (detail 20s, match
 * 10s, chat 8s) and none of them stopped when the tab went to the background,
 * so a forgotten tab kept a live tournament's most expensive endpoint warm
 * indefinitely. Polling resumes — and fires once immediately — when the tab
 * comes back, which is also the moment the user most wants fresh data.
 *
 * `fn` is held in a ref so a caller passing an inline closure does not restart
 * the interval on every render.
 */
export function useVisiblePoll(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
): void {
  const saved = useRef(fn)
  useEffect(() => {
    saved.current = fn
  }, [fn])

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (timer != null) clearInterval(timer)
      timer = null
    }
    const start = () => {
      if (timer != null) return
      timer = setInterval(() => void saved.current(), intervalMs)
    }

    const onVisibility = () => {
      if (document.hidden) {
        stop()
        return
      }
      // Catch up on whatever was missed, then resume the cadence.
      void saved.current()
      start()
    }

    if (!document.hidden) start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [intervalMs, enabled])
}
