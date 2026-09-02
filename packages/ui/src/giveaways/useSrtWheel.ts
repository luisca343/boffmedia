"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSrtDrawAudio, usePrefersReducedMotion, useSrtDrawRun } from "./draw-engine"
import { normalizeDrawName } from "./draw-stage"

interface WheelSegment {
  name: string
  angle: number
  startAngle: number
}

export interface UseSrtWheelOptions {
  segments: WheelSegment[]
  winner: string
  durationMs: number
  muted: boolean
  step: number
}

/**
 * Angle convention: segments laid out CLOCKWISE FROM 12 O'CLOCK.
 * CSS rotate() is clockwise. Pointer at 0°.
 * Segment mid-angle m → target rotation R = turns*360 + (360 - m) + offset.
 * After rotating by R, the mid-angle sits at: m + R ≡ 0 (mod 360) → segment under pointer.
 * To find current segment from rotation rot:
 *   a = ((360 - (rot % 360)) % 360 + 360) % 360
 * Then find segment where a ∈ [startAngle, startAngle + angle).
 */
export function useSrtWheel(opts: UseSrtWheelOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const audio = useSrtDrawAudio(opts.muted)
  const prefersReducedMotion = usePrefersReducedMotion()
  const gRef = useRef<SVGGElement | null>(null)
  const targetRef = useRef(0)
  const lastCrossingRef = useRef(-1)
  const tickCounterRef = useRef(0)

  // Normalised: merging keeps the FIRST spelling as the display name, so the
  // drawn winner ("ana") need not equal the segment label ("Ana").
  const winnerKey = normalizeDrawName(opts.winner)
  const winnerSegmentIndex = opts.segments.findIndex((s) => normalizeDrawName(s.name) === winnerKey)
  const winnerSegment = opts.segments[winnerSegmentIndex]

  // Compute target ONCE per run (not per frame)
  useEffect(() => {
    if (!winnerSegment) return

    const turns = opts.step === 0 ? 6 : 4
    const winnerMidAngle = winnerSegment.startAngle + winnerSegment.angle / 2
    const segmentAngle = winnerSegment.angle
    const maxOffset = (segmentAngle * 35) / 100
    const randomOffset = (Math.random() - 0.5) * maxOffset * 2
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, randomOffset))

    targetRef.current = turns * 360 + (360 - winnerMidAngle) + clampedOffset
  }, [opts.step, winnerSegment])

  const onFrame = useCallback(
    (progress: number) => {
      if (prefersReducedMotion || !gRef.current || !winnerSegment) return

      const target = targetRef.current

      // ONE monotonic ease-out that reaches EXACTLY 1 at progress 1: the frame
      // loop must finish on `target`, because onLand() also writes `target`.
      // (A piecewise curve that ended at 0.9 left the wheel a tenth of a turn
      // short and the land then snapped it onto a different segment.)
      const eased = 1 - Math.pow(1 - progress, 4)

      // Settle wobble in ABSOLUTE degrees — a fraction of `target` would scale
      // with the turn count and could throw the pointer out of a thin slice.
      // Decays to exactly 0 at progress 1 so it never shifts the landing.
      let wobble = 0
      if (progress > 0.85) {
        const q = (progress - 0.85) / 0.15
        const amp = Math.min(3, winnerSegment.angle * 0.2)
        wobble = Math.sin(q * Math.PI * 3) * amp * (1 - q) * (1 - q)
      }

      const rotation = target * eased + wobble
      gRef.current.style.transform = `rotate(${rotation}deg)`

      // Find current segment: angle from pointer
      const normalizedRot = ((360 - (rotation % 360)) % 360 + 360) % 360
      let newIndex = 0
      for (let i = 0; i < opts.segments.length; i++) {
        const seg = opts.segments[i]
        if (normalizedRot >= seg.startAngle && normalizedRot < seg.startAngle + seg.angle) {
          newIndex = i
          break
        }
      }

      if (newIndex !== lastCrossingRef.current) {
        if (progress < 0.3) {
          tickCounterRef.current = (tickCounterRef.current + 1) % 5
          if (tickCounterRef.current === 0) audio.tick()
        } else {
          audio.tick()
        }
        lastCrossingRef.current = newIndex
        setCurrentIndex(newIndex)
      }
    },
    [opts.segments, prefersReducedMotion, winnerSegment, audio]
  )

  const onLand = useCallback(() => {
    if (!gRef.current) return
    const target = targetRef.current
    gRef.current.style.transform = `rotate(${target}deg)`
    setCurrentIndex(winnerSegmentIndex)
    audio.win()
  }, [winnerSegmentIndex, audio])

  const onSkip = useCallback(() => {
    if (!gRef.current) return
    const target = targetRef.current
    gRef.current.style.transition = "transform 450ms cubic-bezier(.2,.8,.2,1)"
    gRef.current.style.transform = `rotate(${target}deg)`
    setCurrentIndex(winnerSegmentIndex)
    setTimeout(() => {
      if (gRef.current) gRef.current.style.transition = "none"
    }, 450)
  }, [winnerSegmentIndex])

  const run = useSrtDrawRun({
    durationMs: opts.durationMs,
    settleMs: 1200,
    startDelayMs: 400,
    reducedMotion: prefersReducedMotion,
    onFrame,
    onLand,
    onSkip
  })

  return {
    gRef,
    currentIndex,
    winnerIndex: winnerSegmentIndex,
    phase: run.phase,
    skip: run.skip
  }
}
