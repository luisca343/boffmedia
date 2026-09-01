"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import { MewCat } from "@/components/boffmedia/ui/mewgenics/cat"
import type { BuilderState } from "./builder-state"

type StageBg = "paper" | "night" | "grid"

// One value per backdrop, applied to BOTH the stage and the canvas. The canvas
// paints its own paper by default, so a stage-only backdrop looked broken: the
// cat stayed on a cream square whatever you picked.
const BG_VALUE: Record<StageBg, string> = {
  paper: "var(--mwp-paper)",
  night: "var(--mwp-night-2)",
  grid: "repeating-conic-gradient(var(--mwp-night-3) 0% 25%, var(--mwp-night-2) 0% 50%) 0 0 / 24px 24px",
}

const ZOOM_MIN = 0.55
const ZOOM_MAX = 2
const ZOOM_STEP = 0.15

/**
 * The cat gets the page, not a 400px box in the middle of one.
 *
 * The size is MEASURED from the stage rather than fixed, so the same screen
 * that used to show a 400px cat surrounded by dead pixels now shows a cat as
 * large as the room allows. It is rounded to 16px steps on purpose: MewCat
 * recomposites (fetch → draw → per-pixel palette pass) on every size change, so
 * an unrounded resize observer would recomposite dozens of times per drag.
 */
export function BuilderStage({
  state,
  canvasRef,
  onPoseChange,
  busy,
}: {
  state: BuilderState
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPoseChange: (poseType: "eyes" | "mouth", value: string) => void
  busy?: boolean
}) {
  const t = useTranslations("mewgenics")
  const boxRef = React.useRef<HTMLDivElement>(null)
  const [fit, setFit] = React.useState(360)
  const [zoom, setZoom] = React.useState(1)
  const [bg, setBg] = React.useState<StageBg>("paper")

  React.useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => {
      const side = Math.min(el.clientWidth, el.clientHeight) - 24
      const rounded = Math.round(Math.max(200, Math.min(760, side)) / 16) * 16
      setFit((prev) => (prev === rounded ? prev : rounded))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const size = Math.round((fit * zoom) / 16) * 16
  const atMin = zoom <= ZOOM_MIN + 0.001
  const atMax = zoom >= ZOOM_MAX - 0.001

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden [border-radius:var(--wob-sm)] border-2 border-dashed border-[color:var(--mwp-nline)]">
      <div
        ref={boxRef}
        style={{ background: BG_VALUE[bg] }}
        className="flex min-h-[320px] flex-1 items-center justify-center overflow-auto p-3"
      >
        <MewCat
          ref={canvasRef}
          parts={state.parts}
          palette={state.palette}
          pose={state.pose}
          equipment={state.equipment}
          size={size}
          background={BG_VALUE[bg]}
          tightFit
        />
      </div>

      {/* Stage chrome. Pose lives here, on the thing it changes, instead of
          behind a tab three clicks away. */}
      <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night-3)] px-3 py-2">
        <PoseGroup
          label={t("builder.poseEyesLabel")}
          options={["open", "closed"] as const}
          value={state.pose.eyes ?? "open"}
          labelFor={(v) => t(`builder.pose.eyes.${v}`)}
          onPick={(v) => onPoseChange("eyes", v)}
        />
        <PoseGroup
          label={t("builder.poseMouthLabel")}
          options={["normal", "open", "smile"] as const}
          value={state.pose.mouth ?? "normal"}
          labelFor={(v) => t(`builder.pose.mouth.${v}`)}
          onPick={(v) => onPoseChange("mouth", v)}
        />

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--mwp-cream-dim)]">
              {t("builder.stageBg")}
            </span>
            {(["paper", "night", "grid"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBg(key)}
                title={t(`builder.stageBgOption.${key}`)}
                aria-label={t(`builder.stageBgOption.${key}`)}
                aria-pressed={bg === key}
                style={{ background: BG_VALUE[key] }}
                className={`h-6 w-6 border-2 border-solid [border-radius:var(--wob-sm)] transition-all ${
                  bg === key
                    ? "border-[color:var(--mwp-red)] [box-shadow:0_0_0_2px_var(--mwp-red-deep)]"
                    : "border-[color:var(--mwp-nline)] hover:border-[color:var(--mwp-ink)]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <StageIconButton
              icon="minus"
              label={t("builder.zoomOut")}
              disabled={atMin}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            />
            <button
              type="button"
              onClick={() => setZoom(1)}
              title={t("builder.zoomFit")}
              className="min-w-[54px] border-2 border-solid border-[color:var(--mwp-nline)] px-2 py-1 text-center font-mono text-[10px] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:text-[color:var(--mwp-cream)]"
            >
              {Math.round(zoom * 100)}%
            </button>
            <StageIconButton
              icon="plus"
              label={t("builder.zoomIn")}
              disabled={atMax}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            />
          </div>
        </div>
      </div>

      {busy && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 border-2 border-solid border-[color:var(--mwp-nline)] bg-[color:var(--mwp-night)]/85 px-2 py-1 text-[10px] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)]">
          <span className="h-3 w-3 animate-spin border-2 border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%] motion-reduce:animate-none" />
          {t("builder.loadingParts")}
        </div>
      )}
    </div>
  )
}

function StageIconButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: "plus" | "minus"
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid h-7 w-7 place-items-center border-2 border-solid border-[color:var(--mwp-nline)] text-[color:var(--mwp-cream-dim)] [border-radius:var(--wob-sm)] transition-all hover:border-[color:var(--mwp-ink)] hover:bg-[color:var(--mwp-paper)] hover:text-[color:var(--mwp-ink)] disabled:opacity-40 disabled:hover:border-[color:var(--mwp-nline)] disabled:hover:bg-transparent disabled:hover:text-[color:var(--mwp-cream-dim)]"
    >
      <Icon name={icon} size={13} />
    </button>
  )
}

function PoseGroup<T extends string>({
  label,
  options,
  value,
  labelFor,
  onPick,
}: {
  label: string
  options: readonly T[]
  value: T
  labelFor: (v: T) => string
  onPick: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--mwp-cream-dim)]">
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPick(option)}
            aria-pressed={value === option}
            className={`px-2 py-1 text-[11px] font-bold [border-radius:var(--wob-sm)] border-2 border-solid transition-all ${
              value === option
                ? "border-[color:var(--mwp-red)] bg-[color:var(--mwp-red)] text-[color:var(--mwp-paper)]"
                : "border-[color:var(--mwp-nline)] bg-transparent text-[color:var(--mwp-cream-dim)] hover:border-[color:var(--mwp-ink)]"
            }`}
          >
            {labelFor(option)}
          </button>
        ))}
      </div>
    </div>
  )
}
