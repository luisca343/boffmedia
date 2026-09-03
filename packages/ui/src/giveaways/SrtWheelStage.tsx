import * as React from "react"
import { cn } from "../cn"
import { type Translate } from "../i18n"
import { useGiveawaysT } from "./i18n"
import { SrtDrawHead, SrtDrawControls } from "./SrtDrawChrome"
import { SrtDrawFrame } from "./SrtDrawFrame"
import { SrtWheelSvg, SRT_WHEEL_SIZES } from "./SrtWheelSvg"
import { useSrtWheel } from "./useSrtWheel"
import { useSrtDrawSequence } from "./draw-engine"
import {
  WHEEL_LABEL_LIMIT,
  buildWheelSegments,
  mergeParticipants,
  poolForStep,
} from "./draw-stage"
import type { SrtDrawHandle, SrtDrawParticipant, SrtDrawStageProps } from "./draw-stage"

/**
 * ONE run of the wheel — one winner. Mounted with `key={step}` by the stage so
 * every winner gets a fresh hook: without the remount the run stays in phase
 * "done" and the sequence cascades through the remaining winners instantly.
 */
function WheelRun({
  step,
  n,
  merged,
  weighted,
  winners,
  muted,
  onMutedChange,
  onSpinComplete,
  skipRef,
  size,
  frame,
  t,
}: {
  step: number
  n: number
  merged: SrtDrawParticipant[]
  weighted: boolean
  winners: string[]
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onSpinComplete: () => void
  skipRef: React.MutableRefObject<(() => void) | null>
  size: "default" | "large"
  frame?: "panel" | "inset"
  t: Translate
}) {
  const currentWinner = winners[step]

  const pool = React.useMemo(() => poolForStep(merged, winners, step), [merged, winners, step])
  const segments = React.useMemo(() => buildWheelSegments(pool, weighted), [pool, weighted])

  const wheel = useSrtWheel({
    segments,
    winner: currentWinner,
    durationMs: step === 0 ? 8000 : 4500,
    muted,
    step,
  })

  React.useEffect(() => {
    skipRef.current = () => wheel.skip()
  }, [wheel, skipRef])

  const firedRef = React.useRef(false)
  React.useEffect(() => {
    if (wheel.phase === "done" && !firedRef.current) {
      firedRef.current = true
      onSpinComplete()
    }
  }, [wheel.phase, onSpinComplete])

  const isLanded = wheel.phase === "landed" || wheel.phase === "done"
  const showLabels = segments.length <= WHEEL_LABEL_LIMIT
  const hubIndex = isLanded ? wheel.winnerIndex : wheel.currentIndex

  return (
    <>
      <SrtDrawHead
        phase={wheel.phase}
        currentWinner={currentWinner}
        stepIndex={step}
        totalSteps={n}
        size={size}
      />

      <SrtDrawFrame landed={isLanded} variant={frame}>
        <div className={cn("mx-auto w-full", SRT_WHEEL_SIZES[size])}>
          <SrtWheelSvg
            segments={segments}
            gRef={wheel.gRef}
            currentIndex={wheel.currentIndex}
            landedIndex={isLanded ? wheel.winnerIndex : undefined}
            showLabels={showLabels}
            hubName={segments[hubIndex]?.name ?? ""}
          />

          {!showLabels && (
            <p className="mt-2 text-center font-mono text-[0.6875rem] text-txt-muted">
              {t("labelsHidden", { n: segments.length })}
            </p>
          )}
        </div>

        <SrtDrawControls
          isSpinning={wheel.phase === "spinning"}
          landedWinners={winners.slice(0, step)}
          totalWinners={n}
          muted={muted}
          onMutedChange={onMutedChange}
          onSkip={() => wheel.skip()}
        />
      </SrtDrawFrame>
    </>
  )
}

export const SrtWheelStage = React.forwardRef<SrtDrawHandle, SrtDrawStageProps>(
  function SrtWheelStage(
    { participants, winners, weighted, muted, onMutedChange, onComplete, size = "default", frame = "panel", className },
    ref,
  ) {
    const t = useGiveawaysT("common.giveaways.reel")
    const skipRef = React.useRef<(() => void) | null>(null)
    const seq = useSrtDrawSequence(winners, onComplete)

    // Repeated names and per-person weight collapse into ONE bigger segment.
    const merged = React.useMemo(
      () => mergeParticipants(participants, weighted),
      [participants, weighted],
    )

    React.useImperativeHandle(ref, () => ({ skip: () => skipRef.current?.() }), [])

    return (
      <div className={cn("w-full", className)}>
        <WheelRun
          key={seq.step}
          step={seq.step}
          n={winners.length}
          merged={merged}
          weighted={weighted}
          winners={winners}
          muted={muted}
          onMutedChange={onMutedChange}
          onSpinComplete={seq.handleRunDone}
          skipRef={skipRef}
          size={size}
          frame={frame}
          t={t}
        />
      </div>
    )
  },
)

SrtWheelStage.displayName = "SrtWheelStage"
