"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAudio } from "@/hooks/useAudio"

/** Face width and the gutter either side of it — one "stride" of the reel. */
export const REEL_TILE = 110
export const REEL_GAP = 4
export const REEL_STRIDE = REEL_TILE + REEL_GAP * 2

const SPIN_MS = 4200
const SPIN_EASE = "cubic-bezier(0.18, 0.92, 0.18, 1)"
const REVEAL_DELAY_MS = 420

/** How far off dead centre the reel may stop, as a share of one stride. */
const JITTER = 0.26
/** While the reel is still a blur, only every Nth face ticks — otherwise it buzzes. */
const FAST_TICK_EVERY = 5
const FAST_PHASE = 0.45

export interface ReelSpin {
  trackRef: React.RefObject<HTMLDivElement | null>
  /** Pixels the track is pulled left by; the winning face lands on the marker. */
  offset: number
  spinning: boolean
  /** The reel has stopped on the winner. */
  settled: boolean
  /** A beat after settling — when the prize is presented. */
  revealed: boolean
  durationMs: number
  ease: string
}

interface Options {
  winningPosition: number
  tileCount: number
  /** `useArcadePrefs().sound` — the cabinet ticks are opt-out. */
  sound: boolean
  /** Reduced motion skips the spin entirely and lands on the prize. */
  reduceMotion: boolean
}

/**
 * The CS:GO reel. The movement is a single CSS transform transition — the rAF
 * loop below never writes state, it only reads the interpolated matrix so the
 * ticks fire as faces cross the marker (SMARTROTOM_V3.md §5: no motion library,
 * no per-frame React renders).
 */
export function useReelSpin({ winningPosition, tileCount, sound, reduceMotion }: Options): ReelSpin {
  const trackRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [settled, setSettled] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const tick = useAudio("/assets/audio/spinner-tick.wav", 0.25)
  const win = useAudio("/assets/audio/spinner-win.wav", 0.8)

  // `useAudio` hands back a fresh object every render, and `sound` can flip
  // mid-spin; both are read through refs so neither restarts the animation.
  const audio = useRef({ tick, win, sound })
  useEffect(() => {
    audio.current = { tick, win, sound }
  })

  const target = useMemo(() => {
    if (winningPosition < 0) return 0
    const jitter = (Math.random() - 0.5) * 2 * JITTER * REEL_STRIDE
    return (winningPosition + 0.5) * REEL_STRIDE + jitter
  }, [winningPosition])

  useEffect(() => {
    if (tileCount === 0 || winningPosition < 0) return

    if (reduceMotion) {
      setOffset(target)
      setSpinning(false)
      setSettled(true)
      setRevealed(true)
      return
    }

    setOffset(0)
    setSpinning(false)
    setSettled(false)
    setRevealed(false)

    let frameId = 0
    let revealId = 0
    let start = 0
    let lastFace = -1
    let counter = 0

    const readFace = () => {
      const el = trackRef.current
      if (!el) return -1
      const transform = getComputedStyle(el).transform
      if (!transform || transform === "none") return -1
      return Math.floor(-new DOMMatrixReadOnly(transform).m41 / REEL_STRIDE)
    }

    const frame = (now: number) => {
      const elapsed = now - start
      const face = readFace()
      if (face >= 0 && face !== lastFace) {
        lastFace = face
        counter = (counter + 1) % FAST_TICK_EVERY
        const blurring = elapsed < SPIN_MS * FAST_PHASE
        if (audio.current.sound && (!blurring || counter === 0)) audio.current.tick.play()
      }

      if (elapsed < SPIN_MS) {
        frameId = requestAnimationFrame(frame)
        return
      }

      setSpinning(false)
      setSettled(true)
      if (audio.current.sound) audio.current.win.play()
      revealId = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS)
    }

    // One frame of headroom so the browser paints the reel at rest before the
    // transition to `target` begins — without it there is nothing to ease from.
    const armId = requestAnimationFrame(() => {
      setSpinning(true)
      setOffset(target)
      start = performance.now()
      frameId = requestAnimationFrame(frame)
    })

    return () => {
      cancelAnimationFrame(armId)
      cancelAnimationFrame(frameId)
      window.clearTimeout(revealId)
    }
  }, [target, tileCount, winningPosition, reduceMotion])

  return {
    trackRef,
    offset,
    spinning,
    settled,
    revealed,
    durationMs: reduceMotion ? 0 : SPIN_MS,
    ease: SPIN_EASE,
  }
}
