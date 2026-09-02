"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useSrtDrawAudio, usePrefersReducedMotion, useSrtDrawRun } from "./draw-engine"

export interface UseSrtReelOptions {
  items: string[]
  winner: string
  durationMs: number
  muted: boolean
  itemWidth?: number
  settleMs?: number
}

export type SrtReelPhase = "idle" | "spinning" | "landed" | "done"

export interface UseSrtReelResult {
  strip: string[]
  centerIndex: number
  winnerIndex: number
  phase: SrtReelPhase
  viewportRef: React.RefObject<HTMLDivElement | null>
  trackRef: React.RefObject<HTMLDivElement | null>
  skip: () => void
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

export function useSrtReel(o: UseSrtReelOptions): UseSrtReelResult {
  const itemWidth = o.itemWidth ?? 200
  const settleMs = o.settleMs ?? 1200
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  // Generate strip once per content key
  const itemsKey = o.items.join(" ")
  const { strip, winnerIndex } = useMemo(() => {
    if (o.items.length === 0) return { strip: [], winnerIndex: 0 }

    const total = clamp(Math.round(o.durationMs / 8000 * 300), 90, 300)
    const winPos = total - 15
    const generated: string[] = []

    for (let i = 0; i < total; i++) {
      if (i === winPos) {
        generated.push(o.winner)
      } else {
        let candidate = o.items[Math.floor(Math.random() * o.items.length)]
        while (i >= total - 30 && candidate === o.winner) {
          candidate = o.items[Math.floor(Math.random() * o.items.length)]
        }
        generated.push(candidate)
      }
    }

    return { strip: generated, winnerIndex: winPos }
  }, [itemsKey, o.winner, o.durationMs])

  const [centerIndex, setCenterIndex] = useState(0)
  const audio = useSrtDrawAudio(o.muted)
  const prefersReducedMotion = usePrefersReducedMotion()
  const lastPosRef = useRef(0)
  const lastCenterIndexRef = useRef(-1)
  const phaseRef = useRef<"fast" | "slow">("fast")
  const soundCounterRef = useRef(0)

  // Compute target position once per hook call
  const containerWidth = viewportRef.current?.clientWidth || 0
  const finalPosition = winnerIndex * itemWidth - containerWidth / 2 + itemWidth / 2
  const randomOffset = (Math.random() - 0.5) * itemWidth * 0.5
  const clampedOffset = clamp(randomOffset, -itemWidth * 0.25, itemWidth * 0.25)
  const targetPosition = clamp(finalPosition + clampedOffset, 0, strip.length * itemWidth - containerWidth)

  const onFrame = useCallback(
    (progress: number) => {
      if (prefersReducedMotion || !trackRef.current) return

      const trackEl = trackRef.current
      let newPosition: number

      if (progress < 0.3) {
        const normalized = progress / 0.3
        const eased = 1 - Math.pow(1 - normalized, 2)
        newPosition = eased * (targetPosition * 0.95)
      } else {
        const slowProgress = (progress - 0.3) / 0.7
        const transitionPoint = targetPosition * 0.95
        const remaining = targetPosition - transitionPoint
        const baseApproach = transitionPoint + remaining * (1 - Math.pow(1 - slowProgress, 3))

        let oscillation = 0
        if (slowProgress > 0.1 && slowProgress < 0.9) {
          const oscProgress = (slowProgress - 0.1) / 0.8
          oscillation = Math.sin(oscProgress * 4 * Math.PI) * 4 * Math.pow(1 - oscProgress, 1.5)
        }
        newPosition = baseApproach + oscillation
      }

      newPosition = Math.max(newPosition, lastPosRef.current)
      trackEl.style.transform = `translateX(${-newPosition}px)`

      if (progress < 0.3) {
        const blurPx = Math.round((1 - progress / 0.3) * 3)
        trackEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : ""
      } else {
        trackEl.style.filter = ""
      }

      const newCenterIndex = Math.floor((newPosition + containerWidth / 2) / itemWidth)
      if (newCenterIndex !== lastCenterIndexRef.current) {
        setCenterIndex(newCenterIndex)

        if (progress < 0.3) {
          soundCounterRef.current = (soundCounterRef.current + 1) % 5
          if (soundCounterRef.current === 0) audio.tick()
        } else {
          audio.tick()
        }

        lastCenterIndexRef.current = newCenterIndex
      }

      lastPosRef.current = newPosition
    },
    [targetPosition, containerWidth, itemWidth, prefersReducedMotion, audio]
  )

  const onLand = useCallback(() => {
    if (!trackRef.current) return
    const trackEl = trackRef.current
    trackEl.style.transform = `translateX(${-targetPosition}px)`
    trackEl.style.filter = ""
    setCenterIndex(winnerIndex)
    audio.win()
  }, [targetPosition, winnerIndex, audio])

  const onSkip = useCallback(() => {
    if (!trackRef.current) return
    const trackEl = trackRef.current
    trackEl.style.transition = "transform 450ms cubic-bezier(.2,.8,.2,1)"
    trackEl.style.transform = `translateX(${-targetPosition}px)`
    trackEl.style.filter = ""
    setCenterIndex(winnerIndex)
    setTimeout(() => {
      trackEl.style.transition = "none"
    }, 450)
  }, [targetPosition, winnerIndex])

  const run = useSrtDrawRun({
    durationMs: o.durationMs,
    settleMs,
    startDelayMs: 400,
    reducedMotion: prefersReducedMotion,
    onFrame,
    onLand,
    onSkip
  })

  return {
    strip,
    centerIndex,
    winnerIndex,
    phase: run.phase,
    viewportRef,
    trackRef,
    skip: run.skip
  }
}
