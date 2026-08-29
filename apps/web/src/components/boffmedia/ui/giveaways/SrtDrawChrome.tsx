"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Button, IconButton, cn } from "@boffmedia/ui"
import type { SrtDrawPhase } from "./draw-stage"
import { initials } from "./draw-util"

/**
 * Chrome shared by every draw mode. It owns its own translations
 * (`common.giveaways.reel`) so no stage can drift into hardcoded copy.
 */

export interface SrtDrawHeadProps {
  phase: SrtDrawPhase
  currentWinner: string
  /** 0-based index of the run in progress. */
  stepIndex: number
  totalSteps: number
  size?: "default" | "large"
}

export function SrtDrawHead({
  phase,
  currentWinner,
  stepIndex,
  totalSteps,
  size = "default",
}: SrtDrawHeadProps) {
  const t = useTranslations("common.giveaways.reel")
  const isLanded = phase === "landed" || phase === "done"
  const title = isLanded
    ? t("landed", { name: currentWinner })
    : totalSteps === 1
      ? t("spinning")
      : t("spinningOf", { i: stepIndex + 1, n: totalSteps })

  return (
    <div className="mb-4 flex items-center gap-3 px-1">
      <Badge tone={isLanded ? "new" : "live"}>{isLanded ? t("landedTag") : t("live")}</Badge>
      <h2
        className={cn(
          "font-display font-bold italic uppercase tracking-[0.01em] transition-colors",
          size === "large" ? "text-[clamp(24px,3vw,40px)]" : "text-lg",
        )}
        aria-live="polite"
      >
        {title}
      </h2>
    </div>
  )
}

export interface SrtDrawControlsProps {
  isSpinning: boolean
  /** Winners that have already landed, in order. */
  landedWinners: string[]
  /** How many winners this draw has in total (the rail's denominator). */
  totalWinners: number
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onSkip: () => void
}

export function SrtDrawControls({
  isSpinning,
  landedWinners,
  totalWinners,
  muted,
  onMutedChange,
  onSkip,
}: SrtDrawControlsProps) {
  const t = useTranslations("common.giveaways.reel")

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {totalWinners > 1 && landedWinners.length > 0 ? (
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto bm-scroll">
          {landedWinners.map((name, idx) => (
            <div
              key={`${idx}-${name}`}
              className="flex flex-none items-center gap-2 border border-line-2 bg-panel-2 px-[10px] py-[7px]"
            >
              <Avatar className="h-[24px] w-[24px] flex-none text-[10px]">{initials(name)}</Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs font-medium text-txt">{name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-muted">
                  {t("winnerOf", { i: idx + 1, n: totalWinners })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      <div className="flex flex-none items-center gap-2">
        {isSpinning && (
          <Button variant="ghost" size="sm" icon="skip" onClick={onSkip}>
            {t("skip")}
          </Button>
        )}
        <IconButton
          name={muted ? "mute" : "volume"}
          label={muted ? t("soundOff") : t("soundOn")}
          variant="ghost"
          size="sm"
          onClick={() => onMutedChange(!muted)}
          aria-pressed={muted}
        />
      </div>
    </div>
  )
}
