"use client"

import { useMemo, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { SealStatus } from "../../_types"

/** A sheet of parchment. The texture itself is the `.ms-paper` material. */
export function Paper({
  children,
  className,
  tilt = 0,
  style,
  ...rest
}: {
  children: ReactNode
  className?: string
  /** Rest angle on the cork, in degrees. */
  tilt?: number
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("ms-paper", className)}
      style={{ ...(tilt ? { transform: `rotate(${tilt}deg)` } : null), ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Small-caps meta line — the board's only label style. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-ms-uppercase text-[0.625rem] uppercase tracking-[.16em] text-ms-ink-3",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Ink-on-paper progress. `gold` is used where the figure is an achievement. */
export function Bar({ value, max = 100, gold = false, className }: { value: number; max?: number; gold?: boolean; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className={cn("relative h-1.5 overflow-hidden border border-ms-ink-3 bg-ms-ink-1/20", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className={cn(
          "block h-full transition-[width] duration-500",
          gold ? "bg-gradient-to-r from-ms-gold-3 to-ms-gold-2" : "bg-gradient-to-r from-ms-ink-2 to-ms-ink-1",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * The diagonal stamp struck across a finished paper. It falls once, on reveal —
 * and not at all when the reader asked for less motion.
 */
export function Stamp({
  children,
  kind = "completed",
  className,
}: {
  children: ReactNode
  kind?: "completed" | "failed"
  className?: string
}) {
  return (
    <div
      className={cn(
        "ms-stamp animate-ms-stamp-down motion-reduce:animate-none",
        kind === "failed" && "ms-stamp-failed",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Gold motes drifting off a quest in progress. Positions are stable per mount. */
export function Sparkles({ count = 4 }: { count?: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
        animationDelay: `${Math.random() * 3}s`,
        width: Math.random() * 4 + 4,
        height: Math.random() * 4 + 4,
      })),
    [count],
  )
  return (
    <>
      {motes.map((mote, i) => (
        <span key={i} aria-hidden className="ms-sparkle animate-ms-spark motion-reduce:animate-none" style={mote} />
      ))}
    </>
  )
}

/** Empty state — the board with nothing pinned to it. */
export function EmptyBoard({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-[2] px-5 py-16 text-center font-ms-display text-lg italic text-ms-paper-2">
      ✥ {children}
    </div>
  )
}
