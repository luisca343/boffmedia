"use client"

import * as React from "react"
import { cn } from "@boffmedia/ui"
import { initials as getInitials } from "./draw-util"

export interface SrtReelCardProps {
  name: string
  state: "idle" | "current" | "winner"
  winnerLabel: string
}

/**
 * Reel card: 180px wide + 10px margins each side = 200px pitch (matches itemWidth in useSrtReel).
 */
export const SrtReelCard = React.memo(function SrtReelCard({ name, state, winnerLabel }: SrtReelCardProps) {
  const initials = getInitials(name)
  const isWinner = state === "winner"
  const isCurrent = state === "current" || state === "winner"

  return (
    <div
      className={cn(
        "cut-corner cut-corner-edge [--cut-lg:12px]",
        "relative mx-[10px] flex h-64 w-[180px] flex-none flex-col items-center justify-center p-4 transition-all duration-[120ms]",
        isWinner
          ? "scale-105 border border-accent-line bg-accent-soft"
          : isCurrent
            ? "scale-105 border border-accent-line bg-panel-2"
            : "border border-line-2 bg-panel-2"
      )}
      style={{
        boxShadow:
          isWinner
            ? "0 0 30px color-mix(in srgb, var(--accent) 34%, transparent), 0 0 80px color-mix(in srgb, var(--accent) 14%, transparent)"
            : isCurrent
              ? "0 0 18px color-mix(in srgb, var(--accent) 22%, transparent)"
              : "none"
      }}
    >
      {/* Winner backdrop glow (only on winner) */}
      {isWinner && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-[bm-pulse_1.5s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)"
          }}
        />
      )}

      {/* Initials seal */}
      <div
        className={cn(
          "cut-seal cut-seal-edge [--cut:10px]",
          "mb-3 grid h-20 w-20 select-none place-items-center border font-display text-2xl font-extrabold not-italic",
          isWinner
            ? "border-accent-line bg-accent text-accent-ink"
            : isCurrent
              ? "border-accent-line bg-accent-soft text-accent"
              : "border-line-2 bg-base-deep text-txt-muted"
        )}
        style={{
          letterSpacing: initials.length > 1 ? "-0.03em" : "0"
        }}
      >
        {initials}
      </div>

      {/* Name */}
      <p
        className={cn(
          "max-w-full truncate px-2 text-center font-mono text-xs font-medium tracking-[0.02em]",
          isWinner ? "text-accent" : isCurrent ? "text-txt" : "text-txt-muted"
        )}
      >
        {name}
      </p>

      {/* Winner tag (only on winner) */}
      {isWinner && (
        <span className="mt-2 animate-[bm-fade_0.3s_ease-out] bg-accent px-[10px] py-[2px] font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink motion-reduce:animate-none">
          {winnerLabel}
        </span>
      )}
    </div>
  )
})
