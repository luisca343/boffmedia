import { useEffect, useRef, useCallback, useState } from "react"
import { useAudio } from "../hooks/use-audio"
import { ASSET, joinAssetPath } from "@boffmedia/asset-paths"
import { uiAssetUrl } from "../i18n"
import type { SrtDrawPhase } from "./draw-stage"

/**
 * Audio for draw animations (shared by all modes).
 *
 * URL RESOLUTION is host-owned: web serves the tree from its own origin;
 * the launcher serves it from its on-disk boffasset:// cache. So the path and
 * its resolution are two separate steps here.
 */
export function useSrtDrawAudio(muted: boolean) {
  const tickPath = joinAssetPath(ASSET.boffmedia.img, "audio", "spinner-tick.wav")
  const winPath = joinAssetPath(ASSET.boffmedia.img, "audio", "spinner-win.wav")
  const tickSound = useAudio(uiAssetUrl(tickPath), 0.25)
  const winSound = useAudio(uiAssetUrl(winPath), 0.8)
  const muteRef = useRef(muted)

  useEffect(() => {
    muteRef.current = muted
  }, [muted])

  return {
    tick: () => {
      if (!muteRef.current) tickSound.play()
    },
    win: () => {
      if (!muteRef.current) winSound.play()
    }
  }
}

/**
 * Detect prefers-reduced-motion (memoized, SSR-safe)
 */
export function usePrefersReducedMotion(): boolean {
  return useRef(
    typeof window !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false
  ).current
}

export interface UseSrtDrawRunOptions {
  durationMs: number
  settleMs?: number
  startDelayMs?: number
  reducedMotion: boolean
  onFrame?: (progress: number) => void
  onLand: () => void
  onSkip: () => void
}

/**
 * Shared animation engine for draw stages
 * Manages: idle → (startDelayMs) → spinning (calls onFrame per rAF) → landed → (settleMs) → done
 */
export function useSrtDrawRun(opts: UseSrtDrawRunOptions) {
  const settleMs = opts.settleMs ?? 1200
  const startDelayMs = opts.startDelayMs ?? 400
  const { durationMs, reducedMotion } = opts

  const [phase, setPhase] = useState<SrtDrawPhase>("idle")

  // Callbacks through a ref: `opts` is a fresh object every render, so keeping
  // it in the effect deps restarted the start-delay on any parent re-render
  // (toggling mute mid-countdown) and left the rAF closure stale.
  const cbRef = useRef(opts)
  cbRef.current = opts

  const animationRef = useRef<number>(0)
  const skipTriggeredRef = useRef(false)
  const landTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const skip = useCallback(() => {
    if (skipTriggeredRef.current || phase !== "spinning") return
    skipTriggeredRef.current = true

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Caller animates the 450ms glide
    cbRef.current.onSkip()

    // Land after glide
    landTimeoutRef.current = setTimeout(() => {
      setPhase("landed")
      landTimeoutRef.current = setTimeout(() => {
        setPhase("done")
      }, settleMs)
    }, 450)
  }, [phase, settleMs])

  useEffect(() => {
    if (phase !== "idle") return

    if (reducedMotion) {
      // Reduced motion: call onFrame once, then land
      cbRef.current.onFrame?.(1)
      setPhase("landed")
      landTimeoutRef.current = setTimeout(() => {
        setPhase("done")
      }, 600)
      return
    }

    // Normal animation: start after delay
    startTimeoutRef.current = setTimeout(() => {
      setPhase("spinning")
      let startTime = 0

      const animate = (timestamp: number) => {
        if (startTime === 0) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / durationMs, 1)

        cbRef.current.onFrame?.(progress)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          // Animation complete
          setPhase("landed")
          cbRef.current.onLand()

          landTimeoutRef.current = setTimeout(() => {
            setPhase("done")
          }, settleMs)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }, startDelayMs)

    return () => {
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
    }
  }, [phase, durationMs, reducedMotion, startDelayMs, settleMs])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (landTimeoutRef.current) clearTimeout(landTimeoutRef.current)
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
    }
  }, [])

  return { phase, skip }
}

/**
 * Sequential winner shell: manages stepping through multiple winners
 */
export function useSrtDrawSequence(winners: string[], onComplete: () => void) {
  const [step, setStep] = useState(0)
  const onCompleteRef = useRef(false)
  const n = winners.length
  const isLastStep = step === n - 1

  const handleRunDone = useCallback(() => {
    if (isLastStep && !onCompleteRef.current) {
      onCompleteRef.current = true
      onComplete()
    } else if (!isLastStep) {
      setTimeout(() => setStep((s) => s + 1), 300)
    }
  }, [isLastStep, onComplete])

  return { step, handleRunDone, remaining: () => step }
}
