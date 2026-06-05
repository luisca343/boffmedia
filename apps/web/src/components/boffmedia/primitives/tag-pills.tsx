"use client"

import { cn } from "@/lib/utils"

interface PillOption {
  value: string
  label: string
  tone?: "win" | "loss" | "draw" | "neutral"
}

interface TagPillsProps {
  options: PillOption[]
  value?: string | null
  onChange?: (value: string | null) => void
  size?: "sm" | "md"
  className?: string
}

const TONE_CLASSES: Record<string, string> = {
  win: "text-[var(--trk-win)] border-[color-mix(in_srgb,var(--trk-win)_42%,transparent)] bg-[color-mix(in_srgb,var(--trk-win)_14%,transparent)]",
  loss: "text-[var(--trk-loss)] border-[color-mix(in_srgb,var(--trk-loss)_42%,transparent)] bg-[color-mix(in_srgb,var(--trk-loss)_14%,transparent)]",
  draw: "text-[var(--trk-draw)] border-[color-mix(in_srgb,var(--trk-draw)_42%,transparent)] bg-[color-mix(in_srgb,var(--trk-draw)_14%,transparent)]",
  neutral: "text-[var(--text)] border-[var(--border-strong)] bg-[var(--surface-3)]",
}

export function TagPills({ options, value, onChange, size = "md", className }: TagPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-[0.4rem]", className)}>
      {options.map((o) => {
        const on = value === o.value
        const tone = o.tone || "neutral"
        return onChange ? (
          <button
            key={o.value}
            type="button"
            className={cn(
              "text-xs font-semibold px-[0.6rem] py-[0.32rem] rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border)] text-[var(--text-muted)] bg-transparent cursor-pointer",
              size === "sm" && "text-[11px] px-[0.5rem] py-[0.22rem]",
              on && TONE_CLASSES[tone],
            )}
            onClick={() => onChange(on ? null : o.value)}
          >
            {o.label}
          </button>
        ) : (
          <span
            key={o.value}
            className={cn(
              "text-xs font-semibold px-[0.6rem] py-[0.32rem] rounded-[var(--radius)] [border-width:var(--hairline)] border-solid [border-color:var(--border)] text-[var(--text-muted)] bg-transparent",
              size === "sm" && "text-[11px] px-[0.5rem] py-[0.22rem]",
              on && TONE_CLASSES[tone],
            )}
          >
            {o.label}
          </span>
        )
      })}
    </div>
  )
}
