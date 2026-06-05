"use client"

import { cn } from "@/lib/utils"

interface ResultBadgeProps {
  result: "win" | "loss" | "draw" | null | undefined
  size?: number
  className?: string
}

const MAP: Record<string, [string, string]> = {
  win: ["W", "win"],
  loss: ["L", "loss"],
  draw: ["D", "draw"],
}

export function ResultBadge({ result, size = 32, className }: ResultBadgeProps) {
  const [label, kind] = result ? MAP[result] || ["—", "none"] : ["—", "none"]
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 leading-none",
        "rounded-[var(--radius)] font-mono font-extrabold",
        "[border-width:var(--hairline)] border-solid",
        kind === "win" && "text-[var(--trk-win)] bg-[color-mix(in_srgb,var(--trk-win)_15%,transparent)] [border-color:color-mix(in_srgb,var(--trk-win)_40%,transparent)]",
        kind === "loss" && "text-[var(--trk-loss)] bg-[color-mix(in_srgb,var(--trk-loss)_15%,transparent)] [border-color:color-mix(in_srgb,var(--trk-loss)_40%,transparent)]",
        kind === "draw" && "text-[var(--trk-draw)] bg-[color-mix(in_srgb,var(--trk-draw)_15%,transparent)] [border-color:color-mix(in_srgb,var(--trk-draw)_40%,transparent)]",
        kind === "none" && "text-[var(--text-dim)] bg-[var(--surface-3)] [border-color:var(--border)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {label}
    </span>
  )
}
