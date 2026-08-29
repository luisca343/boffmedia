"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@boffmedia/ui"
import { SrtReelCard } from "./SrtReelCard"
import { useSrtReel } from "./useSrtReel"
import { SrtDrawHead, SrtDrawControls } from "./SrtDrawChrome"
import { SrtDrawFrame } from "./SrtDrawFrame"
import { useSrtDrawSequence } from "./draw-engine"
import type { SrtDrawStageProps, SrtDrawHandle } from "./draw-stage"

// Legacy type for backward compatibility
export type SrtReelStageHandle = SrtDrawHandle

/** Separator for memo keys — NUL cannot appear in a typed name, unlike "|". */
const KEY_SEP = "\u0000"

// Internal component: one reel run, keyed by step so hook resets per winner
function ReelRun({
  step,
  n,
  participants,
  winners,
  muted,
  onMutedChange,
  onSpinComplete,
  skipRef,
  size,
  frame,
  tReel
}: {
  step: number
  n: number
  participants: string[]
  winners: string[]
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onSpinComplete: () => void
  skipRef?: React.MutableRefObject<(() => void) | null>
  size?: "default" | "large"
  frame?: "panel" | "inset"
  tReel: ReturnType<typeof useTranslations>
}) {
  const currentWinner = winners[step]

  // Build participants list minus already-landed winners. Stable string keys
  // so the memo only recomputes when the visible pool actually changes.
  const participantsKey = participants.join(KEY_SEP)
  const landedKey = winners.slice(0, step).join(KEY_SEP)
  const remainingParticipants = React.useMemo(
    () => {
      const landed = new Set(landedKey ? landedKey.split(KEY_SEP) : [])
      return participantsKey ? participantsKey.split(KEY_SEP).filter((p) => !landed.has(p)) : []
    },
    [participantsKey, landedKey]
  )

  const durationMs = step === 0 ? 8000 : 4500

  const reel = useSrtReel({
    items: remainingParticipants,
    winner: currentWinner,
    durationMs,
    muted,
    itemWidth: 200,
    settleMs: 1200
  })

  React.useEffect(() => {
    if (skipRef) {
      skipRef.current = () => reel.skip()
    }
  }, [reel, skipRef])

  const firedRef = React.useRef(false)
  React.useEffect(() => {
    if (reel.phase === "done" && !firedRef.current) {
      firedRef.current = true
      onSpinComplete()
    }
  }, [reel.phase, onSpinComplete])

  const isSpinning = reel.phase === "spinning"
  const isLanded = reel.phase === "landed" || reel.phase === "done"

  return (
    <>
      {/* Shared head: status badge + title */}
      <SrtDrawHead
        phase={reel.phase}
        currentWinner={currentWinner}
        stepIndex={step}
        totalSteps={n}
        size={size}
      />

      {/* Reel viewport */}
      <SrtDrawFrame landed={isLanded} variant={frame}>
        {/* Viewport */}
        <div
          ref={reel.viewportRef}
          className={cn("relative overflow-hidden border border-line-2 bg-base-deep transition-all duration-500", {
            "h-72": size !== "large",
            "h-[min(56vh,560px)]": size === "large"
          })}
          style={{
            boxShadow: isLanded
              ? "inset 0 0 50px color-mix(in srgb, var(--accent) 12%, transparent)"
              : "inset 0 0 30px rgba(0,0,0,0.55)",
            borderColor: isLanded ? "var(--accent-line)" : undefined
          }}
        >
          {/* Items track */}
          <div
            ref={reel.trackRef}
            className="absolute inset-y-0 left-0 flex h-full items-center"
          >
              {reel.strip.map((name, index) => (
              <SrtReelCard
                key={`${index}`}
                name={name}
                state={
                  isLanded && index === reel.winnerIndex
                    ? "winner"
                    : isSpinning && index === reel.centerIndex
                      ? "current"
                      : "idle"
                }
                winnerLabel={tReel("landedTag")}
              />
            ))}
          </div>

          {/* Broadcast scanlines */}
          <div
            className="pointer-events-none absolute inset-0 z-20 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)"
            }}
          />

          {/* Edge fade masks — responsive widths */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 sm:w-28 lg:w-36"
            style={{
              background: "linear-gradient(to right, var(--bg-deep) 40%, transparent)"
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 sm:w-28 lg:w-36"
            style={{
              background: "linear-gradient(to left, var(--bg-deep) 40%, transparent)"
            }}
          />

          {/* Center reticle — top/bottom triangles + line */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 flex -translate-x-[1px] flex-col items-center">
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "14px solid var(--accent)",
                filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))"
              }}
            />
            <span
              className="w-[2px] flex-1"
              style={{
                background: "linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 8%, transparent))"
              }}
            />
            <span
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "14px solid var(--accent)",
                filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))"
              }}
            />
          </div>
        </div>

        {/* Shared controls: rail + skip + mute */}
        <SrtDrawControls
          isSpinning={isSpinning}
          landedWinners={winners.slice(0, step)}
          totalWinners={n}
          muted={muted}
          onMutedChange={onMutedChange}
          onSkip={() => reel.skip()}
        />
      </SrtDrawFrame>
    </>
  )
}

export const SrtReelStage = React.forwardRef<SrtDrawHandle, SrtDrawStageProps>(function SrtReelStage({
  participants,
  winners,
  muted,
  onMutedChange,
  onComplete,
  className,
  size = "default",
  frame = "panel"
}, ref) {
  const participantNames = participants.map((p) => p.name)
  const tReel = useTranslations("common.giveaways.reel")
  const skipRef = React.useRef<(() => void) | null>(null)

  const seq = useSrtDrawSequence(winners, onComplete)

  React.useImperativeHandle(ref, () => ({
    skip: () => {
      skipRef.current?.()
    }
  }), [])

  return (
    <div className={cn("w-full", className)}>
      {/* Reel run keyed on step so hook resets per winner */}
      <ReelRun
        key={seq.step}
        step={seq.step}
        n={winners.length}
        participants={participantNames}
        winners={winners}
        muted={muted}
        onMutedChange={onMutedChange}
        onSpinComplete={seq.handleRunDone}
        skipRef={skipRef}
        size={size}
        frame={frame}
        tReel={tReel}
      />
    </div>
  )
})

SrtReelStage.displayName = "SrtReelStage"
