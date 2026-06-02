"use client"

import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface TagProps {
  children: React.ReactNode
  tone?: "neutral" | "accent" | "orange"
  onRemove?: () => void
  className?: string
}

const toneStyles: Record<string, string> = {
  neutral: "",
  accent: "text-[var(--accent-bright)] border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)]",
  orange: "text-orange-400 border-[color-mix(in_srgb,var(--orange-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--orange-500)_12%,transparent)]",
}

export function Tag({ children, tone = "neutral", onRemove, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "text-xs font-semibold",
        "py-1 px-2",
        "rounded-[var(--radius-pill,9999px)]",
        "border border-solid border-[var(--border-strong)]",
        "bg-[var(--surface-2)] text-[var(--text-muted)]",
        "data-[direction=hud]:rounded-[3px]",
        toneStyles[tone],
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          className="grid place-items-center border-0 bg-transparent text-current cursor-pointer p-0 opacity-70 hover:opacity-100"
          aria-label="Quitar"
          onClick={onRemove}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  )
}
