"use client"

import { useEffect, useRef, useState } from "react"

/** OS preference OR the in-app "reducir motion" switch on the `.ar-app` root. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true
  return document.querySelector('.ar-app[data-motion="off"]') !== null
}

/**
 * Rolls a figure up to its new value on an ease-out curve — the coin/score
 * counter tick. Snaps straight to the target when motion is reduced.
 */
export function useCountUp(target: number, duration = 750): number {
  const [value, setValue] = useState(target)
  const previous = useRef(target)

  useEffect(() => {
    const from = previous.current
    previous.current = target
    if (from === target || prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
