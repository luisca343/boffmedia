"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSrtDrawAudio, usePrefersReducedMotion, useSrtDrawRun } from "./draw-engine"
import { normalizeDrawName } from "./draw-stage"

export interface UseSrtSpotlightOptions {
  visibleCards: string[]
  winner: string
  durationMs: number
  muted: boolean
}

export function useSrtSpotlight(opts: UseSrtSpotlightOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const audio = useSrtDrawAudio(opts.muted)
  const prefersReducedMotion = usePrefersReducedMotion()
  const hopScheduleRef = useRef<number[]>([])
  const NRef = useRef(0)
  const lastHopRef = useRef(-1)

  // Normalised for the same reason as the wheel (merged display names).
  const winnerKey = normalizeDrawName(opts.winner)
  const winnerIndex = Math.max(
    0,
    opts.visibleCards.findIndex((name) => normalizeDrawName(name) === winnerKey),
  )

  // Build hop schedule ONCE per run (not per frame)
  useEffect(() => {
    if (opts.visibleCards.length === 0) return

    const N = Math.max(24, Math.min(80, Math.round(opts.durationMs / 110)))
    NRef.current = N
    const hopSchedule: number[] = []

    // Generate random hops (never same twice in a row)
    let lastIdx = -1
    for (let k = 0; k < N; k++) {
      let idx = Math.floor(Math.random() * opts.visibleCards.length)
      while (idx === lastIdx && opts.visibleCards.length > 1) {
        idx = Math.floor(Math.random() * opts.visibleCards.length)
      }
      hopSchedule.push(idx)
      lastIdx = idx
    }
    hopSchedule[N - 1] = winnerIndex

    hopScheduleRef.current = hopSchedule
  }, [opts.visibleCards.length, opts.durationMs, winnerIndex])

  const onFrame = useCallback(
    (progress: number) => {
      if (prefersReducedMotion || opts.visibleCards.length === 0) return

      const N = NRef.current
      const hopSchedule = hopScheduleRef.current
      if (hopSchedule.length === 0) return

      // Map progress to hop index via decelerating curve
      const currentHop = Math.floor((1 - Math.pow(1 - progress, 2.2)) * N)
      if (currentHop !== lastHopRef.current && currentHop < N) {
        const idx = hopSchedule[currentHop]
        setCurrentIndex(idx)

        // Throttle ticks while p < 0.3
        if (progress < 0.3) {
          if (currentHop % 2 === 0) audio.tick()
        } else {
          audio.tick()
        }

        lastHopRef.current = currentHop
      }
    },
    [prefersReducedMotion, audio]
  )

  const onLand = useCallback(() => {
    setCurrentIndex(winnerIndex)
    audio.win()
  }, [winnerIndex, audio])

  const onSkip = useCallback(() => {
    setCurrentIndex(winnerIndex)
  }, [winnerIndex])

  const run = useSrtDrawRun({
    durationMs: opts.durationMs,
    settleMs: 1200,
    startDelayMs: 400,
    reducedMotion: prefersReducedMotion,
    onFrame,
    onLand,
    onSkip
  })

  const skip = useCallback(() => {
    run.skip()
  }, [run])

  return {
    currentIndex,
    phase: run.phase,
    skip
  }
}
