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
  const settleMs = o.settleMs ?? 250
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
  const soundCounterRef = useRef(0)
  const targetPositionRef = useRef<number | null>(null)
  const itemPitchRef = useRef(itemWidth)
  const itemLeadingMarginRef = useRef(0)
  const itemCenterOffsetRef = useRef(itemWidth / 2)

  // The reel card dimensions are expressed in rem. The host can scale the
  // root font size on large screens, so the visual pitch is not always the
  // 200px fallback passed by the stage. Read the layout width instead of
  // letting the math drift away from the card that is actually under the
  // reticle.
  const getItemMetrics = useCallback(() => {
    const firstCard = trackRef.current?.firstElementChild as HTMLElement | null
    if (firstCard && typeof window !== "undefined") {
      const styles = window.getComputedStyle(firstCard)
      const marginLeft = Number.parseFloat(styles.marginLeft) || 0
      const marginRight = Number.parseFloat(styles.marginRight) || 0
      const pitch = firstCard.offsetWidth + marginLeft + marginRight

      if (pitch > 0) {
        itemPitchRef.current = pitch
        itemLeadingMarginRef.current = marginLeft
        itemCenterOffsetRef.current = marginLeft + firstCard.offsetWidth / 2
      }
    }

    return {
      pitch: itemPitchRef.current,
      leadingMargin: itemLeadingMarginRef.current,
      centerOffset: itemCenterOffsetRef.current
    }
  }, [itemWidth])

  // Correct the arithmetic with the actual card bounds. This matters while a
  // highlighted card is scaled, and guarantees that the visual state follows
  // the card physically under the reticle rather than a neighbouring slot.
  const getVisualCenterIndex = useCallback(
    (fallbackIndex: number) => {
      const viewport = viewportRef.current
      const track = trackRef.current
      if (!viewport || !track || track.children.length === 0) return fallbackIndex

      const viewportRect = viewport.getBoundingClientRect()
      const centerX = viewportRect.left + viewportRect.width / 2
      const firstIndex = clamp(fallbackIndex - 2, 0, track.children.length - 1)
      const lastIndex = clamp(fallbackIndex + 2, 0, track.children.length - 1)
      let closestIndex = fallbackIndex
      let closestDistance = Number.POSITIVE_INFINITY

      for (let index = firstIndex; index <= lastIndex; index++) {
        const card = track.children[index]
        if (!(card instanceof HTMLElement)) continue

        const cardRect = card.getBoundingClientRect()
        if (centerX >= cardRect.left && centerX <= cardRect.right) return index

        const distance = Math.abs(centerX - (cardRect.left + cardRect.width / 2))
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      }

      return closestIndex
    },
    []
  )

  // Keep the landing offset stable for the whole run. This hook re-renders as
  // the centered card changes; generating the offset during render used to
  // move the target underneath the animation on every card crossing.
  const randomOffsetRatio = useMemo(
    () => clamp((Math.random() - 0.5) * 0.5, -0.25, 0.25),
    [itemsKey, o.winner, o.durationMs, itemWidth],
  )

  const getTargetPosition = useCallback(() => {
    if (targetPositionRef.current !== null) return targetPositionRef.current

    const containerWidth = viewportRef.current?.getBoundingClientRect().width || 0
    const { pitch, centerOffset } = getItemMetrics()
    if (!containerWidth) return 0

    const finalPosition = winnerIndex * pitch + centerOffset - containerWidth / 2
    const maxPosition = Math.max(0, strip.length * pitch - containerWidth)
    targetPositionRef.current = clamp(finalPosition + randomOffsetRatio * pitch, 0, maxPosition)
    return targetPositionRef.current
  }, [getItemMetrics, randomOffsetRatio, strip.length, winnerIndex])

  // Reset run-local position bookkeeping if the hook is reused with new data.
  useEffect(() => {
    targetPositionRef.current = null
    itemPitchRef.current = itemWidth
    itemLeadingMarginRef.current = 0
    itemCenterOffsetRef.current = itemWidth / 2
    lastPosRef.current = 0
    lastCenterIndexRef.current = -1
    soundCounterRef.current = 0
    setCenterIndex(0)
  }, [itemsKey, o.winner, o.durationMs])

  const updateCenterIndex = useCallback(() => {
    const containerWidth = viewportRef.current?.getBoundingClientRect().width || 0
    if (!containerWidth || strip.length === 0) return

    const { pitch, leadingMargin } = getItemMetrics()
    const fallbackIndex = clamp(
      Math.floor((lastPosRef.current + containerWidth / 2 - leadingMargin) / pitch),
      0,
      strip.length - 1,
    )
    const index = getVisualCenterIndex(fallbackIndex)
    setCenterIndex((current) => (current === index ? current : index))
  }, [getItemMetrics, getVisualCenterIndex, strip.length])

  // The viewport ref is assigned after render, so establish the initial
  // highlighted card and keep it correct when the stage is resized.
  useEffect(() => {
    updateCenterIndex()
    const viewport = viewportRef.current
    if (!viewport) return

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCenterIndex)
      observer.observe(viewport)
      return () => observer.disconnect()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateCenterIndex)
      return () => window.removeEventListener("resize", updateCenterIndex)
    }
  }, [itemsKey, o.durationMs, o.winner, updateCenterIndex])

  const onFrame = useCallback(
    (progress: number) => {
      if (prefersReducedMotion || !trackRef.current) return

      const trackEl = trackRef.current
      const targetPosition = getTargetPosition()
      const containerWidth = viewportRef.current?.getBoundingClientRect().width || 0
      const { pitch, leadingMargin } = getItemMetrics()
      let newPosition: number

      if (progress < 0.3) {
        const normalized = progress / 0.3
        const eased = 1 - Math.pow(1 - normalized, 2)
        newPosition = eased * (targetPosition * 0.95)
      } else {
        const slowProgress = (progress - 0.3) / 0.7
        const transitionPoint = targetPosition * 0.95
        const remaining = targetPosition - transitionPoint
        newPosition = transitionPoint + remaining * (1 - Math.pow(1 - slowProgress, 3))
      }

      // The target is stable for the run, so this only protects the strip from
      // a frame-level reversal caused by a late frame arriving out of order.
      newPosition = Math.max(newPosition, lastPosRef.current)
      trackEl.style.transform = `translateX(${-newPosition}px)`

      if (progress < 0.3) {
        const blurPx = Math.round((1 - progress / 0.3) * 3)
        trackEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : ""
      } else {
        trackEl.style.filter = ""
      }

      const fallbackCenterIndex = clamp(
        Math.floor((newPosition + containerWidth / 2 - leadingMargin) / pitch),
        0,
        Math.max(0, strip.length - 1),
      )
      const newCenterIndex = getVisualCenterIndex(fallbackCenterIndex)
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
    [audio, getItemMetrics, getTargetPosition, getVisualCenterIndex, prefersReducedMotion, strip.length]
  )

  const onLand = useCallback(() => {
    if (!trackRef.current) return
    const trackEl = trackRef.current
    const targetPosition = getTargetPosition()
    trackEl.style.transform = `translateX(${-targetPosition}px)`
    trackEl.style.filter = ""
    setCenterIndex(winnerIndex)
  }, [getTargetPosition, winnerIndex])

  const onSkip = useCallback(() => {
    if (!trackRef.current) return
    const trackEl = trackRef.current
    const targetPosition = getTargetPosition()
    trackEl.style.transition = "transform 450ms cubic-bezier(.2,.8,.2,1)"
    trackEl.style.transform = `translateX(${-targetPosition}px)`
    trackEl.style.filter = ""
    setCenterIndex(winnerIndex)
    setTimeout(() => {
      trackEl.style.transition = "none"
    }, 450)
  }, [getTargetPosition, winnerIndex])

  const run = useSrtDrawRun({
    durationMs: o.durationMs,
    settleMs,
    startDelayMs: 400,
    reducedMotion: prefersReducedMotion,
    onFrame,
    onLand,
    onDone: audio.win,
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
