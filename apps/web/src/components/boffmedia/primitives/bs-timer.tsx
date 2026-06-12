"use client"

import { cn } from "@/lib/utils"

interface TimerPlayerState {
  turnRemaining: number
  totalRemaining: number
}

interface BSTimerProps {
  p1: TimerPlayerState
  p2: TimerPlayerState
  activeSide: "p1" | "p2" | null
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function TimerBar({
  label,
  turnRemaining,
  totalRemaining,
  isActive,
}: {
  label: string
  turnRemaining: number
  totalRemaining: number
  isActive: boolean
}) {
  const turnPct = Math.max(0, (turnRemaining / 60_000) * 100)
  const totalPct = Math.max(0, (totalRemaining / 300_000) * 100)
  const isLow = turnRemaining < 10_000

  return (
    <div
      className={cn(
        "flex flex-col gap-[.3rem] rounded-[var(--radius)] transition-all duration-[var(--dur)] ease-[var(--ease)]",
        "px-[.6rem] py-[.5rem]",
        isActive
          ? "bg-[color-mix(in_srgb,var(--surface)_86%,transparent)]"
          : "bg-[color-mix(in_srgb,var(--surface)_40%,transparent)] opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-[.66rem] text-[var(--text-muted)]">{label}</span>
        <span
          className={cn(
            "font-mono font-bold text-[.72rem] tabular-nums",
            isLow ? "text-[var(--red-400)] animate-pulse" : "text-[var(--text)]"
          )}
        >
          {formatTime(turnRemaining)}
        </span>
      </div>
      <div className="w-full h-[5px] rounded-[var(--radius-pill)] overflow-hidden bg-[color-mix(in_srgb,#000_45%,var(--surface-3))]">
        <div
          className={cn(
            "h-full rounded-[inherit] transition-[width] duration-1000 ease-[var(--ease)]",
            isLow
              ? "bg-[var(--red-500)]"
              : isActive
                ? "bg-[var(--accent-bright)]"
                : "bg-[var(--surface-3)]"
          )}
          style={{ width: `${turnPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[.54rem] text-[var(--text-dim)]">
        <span>Total</span>
        <span className="tabular-nums">{formatTime(totalRemaining)}</span>
      </div>
      <div className="w-full h-[3px] rounded-[var(--radius-pill)] overflow-hidden bg-[color-mix(in_srgb,#000_45%,var(--surface-3))]">
        <div
          className="h-full rounded-[inherit] bg-[var(--surface-3)] transition-[width] duration-1000 ease-[var(--ease)]"
          style={{ width: `${totalPct}%` }}
        />
      </div>
    </div>
  )
}

export function BSTimer({ p1, p2, activeSide }: BSTimerProps) {
  return (
    <div className="flex gap-[.5rem] w-full max-w-md mx-auto">
      <div className="flex-1">
        <TimerBar label="Jugador" turnRemaining={p1.turnRemaining} totalRemaining={p1.totalRemaining} isActive={activeSide === "p1"} />
      </div>
      <div className="flex-1">
        <TimerBar label="Rival" turnRemaining={p2.turnRemaining} totalRemaining={p2.totalRemaining} isActive={activeSide === "p2"} />
      </div>
    </div>
  )
}
