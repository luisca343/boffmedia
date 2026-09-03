import * as React from "react"
import { cn } from "../cn"
import { useGiveawaysT } from "./i18n"
import { SrtReelCard } from "./SrtReelCard"
import { SrtDrawFrame } from "./SrtDrawFrame"
import { SrtWheelSvg, SRT_WHEEL_SIZES } from "./SrtWheelSvg"
import { SrtSpotlightCard, SRT_SPOTLIGHT_GRID, SPOTLIGHT_VISIBLE_CAP } from "./SrtSpotlightStage"
import { WHEEL_LABEL_LIMIT, buildWheelSegments, mergeParticipants } from "./draw-stage"
import type { SrtDrawParticipant } from "./draw-stage"

/**
 * Setup previews. Each renders through the SAME chassis, widths and geometry as
 * its live stage, so what the user sees before drawing is where the draw lands.
 * Static: no hooks that animate or play audio.
 */

export interface SrtDrawPreviewProps {
  participants: SrtDrawParticipant[]
  weighted?: boolean
  size?: "default" | "large"
  frame?: "panel" | "inset"
  className?: string
}

export function SrtWheelPreview({ participants, weighted = false, size = "default", frame = "panel", className }: SrtDrawPreviewProps) {
  const t = useGiveawaysT("common.giveaways.reel")
  const segments = React.useMemo(
    () => buildWheelSegments(mergeParticipants(participants, weighted), weighted),
    [participants, weighted],
  )
  const showLabels = segments.length <= WHEEL_LABEL_LIMIT

  return (
    <SrtDrawFrame variant={frame} className={className}>
      <div className={cn("mx-auto w-full", SRT_WHEEL_SIZES[size])} aria-hidden>
        <SrtWheelSvg segments={segments} showLabels={showLabels} />
        {!showLabels && (
          <p className="mt-2 text-center font-mono text-[0.6875rem] text-txt-muted">
            {t("labelsHidden", { n: segments.length })}
          </p>
        )}
      </div>
    </SrtDrawFrame>
  )
}

export function SrtReelPreview({ participants, size = "default", frame = "panel", className }: SrtDrawPreviewProps) {
  const cards = participants.slice(0, 6)

  return (
    <SrtDrawFrame variant={frame} className={className}>
      <div className={cn("relative overflow-hidden border border-line-2 bg-base-deep", {
        "h-72": size !== "large",
        "h-[min(56vh,35rem)]": size === "large"
      })} aria-hidden>
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex h-full items-center">
          {cards.map((p, i) => (
            <SrtReelCard key={i} name={p.name} state="idle" winnerLabel="" />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-30 w-16 sm:w-28 lg:w-36"
          style={{ background: "linear-gradient(to right, var(--bg-deep) 40%, transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-30 w-16 sm:w-28 lg:w-36"
          style={{ background: "linear-gradient(to left, var(--bg-deep) 40%, transparent)" }}
        />

        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 flex -translate-x-[1px] flex-col items-center">
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "14px solid var(--accent)",
            }}
          />
          <span
            className="w-[2px] flex-1"
            style={{
              background:
                "linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 8%, transparent))",
            }}
          />
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "14px solid var(--accent)",
            }}
          />
        </div>
      </div>
    </SrtDrawFrame>
  )
}

export function SrtSpotlightPreview({ participants, weighted = false, size = "default", frame = "panel", className }: SrtDrawPreviewProps) {
  const t = useGiveawaysT("common.giveaways.reel")
  const merged = React.useMemo(
    () => mergeParticipants(participants, weighted),
    [participants, weighted],
  )
  const visible = merged.slice(0, Math.min(SPOTLIGHT_VISIBLE_CAP, 24))
  const hidden = merged.length - visible.length

  return (
    <SrtDrawFrame variant={frame} className={className}>
      <div
        className={cn("grid gap-2 overflow-hidden", SRT_SPOTLIGHT_GRID[size], {
          "max-h-[70vh]": size === "large",
          "max-h-[28.75rem]": size !== "large"
        })}
        aria-hidden
      >
        {visible.map((p, i) => (
          <SrtSpotlightCard key={i} name={p.name} state="idle" />
        ))}
        {hidden > 0 && (
          <div className="flex items-center justify-center border border-line-2 bg-panel-2 p-3 font-mono text-xs font-medium text-txt-dim">
            {t("othersN", { n: hidden })}
          </div>
        )}
      </div>
    </SrtDrawFrame>
  )
}
