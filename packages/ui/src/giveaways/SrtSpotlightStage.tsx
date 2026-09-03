import * as React from "react"
import { Avatar, Badge, cn } from "../index"
import { type Translate } from "../i18n"
import { useGiveawaysT } from "./i18n"
import { SrtDrawHead, SrtDrawControls } from "./SrtDrawChrome"
import { SrtDrawFrame } from "./SrtDrawFrame"
import { useSrtSpotlight } from "./useSrtSpotlight"
import { useSrtDrawSequence } from "./draw-engine"
import { initials, makeRng, hashSeed } from "./draw-util"
import { mergeParticipants, normalizeDrawName, poolForStep } from "./draw-stage"
import type { SrtDrawHandle, SrtDrawParticipant, SrtDrawStageProps } from "./draw-stage"

/** How many cards the grid shows before collapsing the rest into one tile. */
export const SPOTLIGHT_VISIBLE_CAP = 60

/** Grid geometry per stage size — shared so a preview matches the live draw. */
export const SRT_SPOTLIGHT_GRID = {
  default: "grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]",
  large: "grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))]",
} as const

export function SrtSpotlightCard({
  name,
  state,
  landedLabel,
}: {
  name: string
  state: "idle" | "current" | "winner"
  landedLabel?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border p-3 transition-all duration-[120ms]",
        state === "idle" && "border-line-2 bg-panel-2 opacity-70",
        state === "current" &&
          "scale-105 border-accent-line bg-accent-soft [box-shadow:0_0_18px_color-mix(in_srgb,var(--accent)_22%,transparent)]",
        state === "winner" &&
          "scale-105 border-accent bg-accent-soft [box-shadow:0_0_30px_color-mix(in_srgb,var(--accent)_34%,transparent)]",
      )}
    >
      <Avatar className="h-[1.75rem] w-[1.75rem] flex-none text-[0.625rem]">{initials(name)}</Avatar>
      <span
        className={cn(
          "min-w-0 truncate font-mono text-xs font-medium",
          state === "idle" ? "text-txt-muted" : "text-txt",
        )}
      >
        {name}
      </span>
      {state === "winner" && landedLabel && (
        <Badge tone="new" className="ml-auto flex-none">
          {landedLabel}
        </Badge>
      )}
    </div>
  )
}

/**
 * ONE run of the spotlight — one winner. Mounted with `key={step}` so the hook
 * resets per winner; without the remount the run stays in phase "done" and the
 * sequence races through the remaining winners without animating them.
 */
function SpotlightRun({
  step,
  n,
  merged,
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
  const cardRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())
  const lastScrollRef = React.useRef(0)

  const pool = React.useMemo(() => poolForStep(merged, winners, step), [merged, winners, step])

  // Deterministic shuffle, capped, winner guaranteed present.
  const visibleCards = React.useMemo(() => {
    if (pool.length === 0) return [] as string[]
    const rng = makeRng(hashSeed(currentWinner + "|" + pool.length))
    const shuffled = pool.map((p) => p.name)
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const tmp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = tmp
    }
    const visible = shuffled.slice(0, SPOTLIGHT_VISIBLE_CAP)
    const key = normalizeDrawName(currentWinner)
    if (!visible.some((name) => normalizeDrawName(name) === key)) visible[0] = currentWinner
    return visible
  }, [pool, currentWinner])

  const spotlight = useSrtSpotlight({
    visibleCards,
    winner: currentWinner,
    durationMs: step === 0 ? 8000 : 4500,
    muted,
  })

  React.useEffect(() => {
    skipRef.current = () => spotlight.skip()
  }, [spotlight, skipRef])

  const firedRef = React.useRef(false)
  React.useEffect(() => {
    if (spotlight.phase === "done" && !firedRef.current) {
      firedRef.current = true
      onSpinComplete()
    }
  }, [spotlight.phase, onSpinComplete])

  React.useEffect(() => {
    const cardEl = cardRefs.current.get(spotlight.currentIndex)
    if (!cardEl) return
    if (spotlight.phase === "spinning") {
      const now = Date.now()
      if (now - lastScrollRef.current >= 400) {
        cardEl.scrollIntoView({ block: "nearest", behavior: "auto" })
        lastScrollRef.current = now
      }
    } else if (spotlight.phase === "landed") {
      cardEl.scrollIntoView({ block: "nearest", behavior: "auto" })
    }
  }, [spotlight.currentIndex, spotlight.phase])

  const isLanded = spotlight.phase === "landed" || spotlight.phase === "done"
  const winnerKey = normalizeDrawName(currentWinner)
  const hidden = pool.length - visibleCards.length

  return (
    <>
      <SrtDrawHead
        phase={spotlight.phase}
        currentWinner={currentWinner}
        stepIndex={step}
        totalSteps={n}
        size={size}
      />

      <SrtDrawFrame landed={isLanded} variant={frame}>
        <div
          className={cn(
            "grid gap-2 overflow-y-auto bm-scroll",
            SRT_SPOTLIGHT_GRID[size],
            size === "large" ? "max-h-[70vh]" : "max-h-[28.75rem]",
          )}
        >
          {visibleCards.map((name, idx) => {
            const state: "idle" | "current" | "winner" = isLanded
              ? normalizeDrawName(name) === winnerKey
                ? "winner"
                : "idle"
              : spotlight.phase === "spinning" && idx === spotlight.currentIndex
                ? "current"
                : "idle"
            return (
              <div
                key={idx}
                ref={(el) => {
                  if (el) cardRefs.current.set(idx, el)
                }}
              >
                <SrtSpotlightCard name={name} state={state} landedLabel={t("landedTag")} />
              </div>
            )
          })}

          {hidden > 0 && (
            <div className="flex items-center justify-center border border-line-2 bg-panel-2 p-3 font-mono text-xs font-medium text-txt-dim">
              {t("othersN", { n: hidden })}
            </div>
          )}
        </div>

        <SrtDrawControls
          isSpinning={spotlight.phase === "spinning"}
          landedWinners={winners.slice(0, step)}
          totalWinners={n}
          muted={muted}
          onMutedChange={onMutedChange}
          onSkip={() => spotlight.skip()}
        />
      </SrtDrawFrame>
    </>
  )
}

export const SrtSpotlightStage = React.forwardRef<SrtDrawHandle, SrtDrawStageProps>(
  function SrtSpotlightStage(
    { participants, winners, weighted, muted, onMutedChange, onComplete, size = "default", frame = "panel", className },
    ref,
  ) {
    const t = useGiveawaysT("common.giveaways.reel")
    const skipRef = React.useRef<(() => void) | null>(null)
    const seq = useSrtDrawSequence(winners, onComplete)

    const merged = React.useMemo(
      () => mergeParticipants(participants, weighted),
      [participants, weighted],
    )

    React.useImperativeHandle(ref, () => ({ skip: () => skipRef.current?.() }), [])

    return (
      <div className={cn("w-full", className)}>
        <SpotlightRun
          key={seq.step}
          step={seq.step}
          n={winners.length}
          merged={merged}
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

SrtSpotlightStage.displayName = "SrtSpotlightStage"
