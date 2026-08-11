"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cssVars } from "./theme"

// wrap row for condition toggles.
export function PillRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-[5px]">{children}</div>
}

export interface TogglePillProps {
  on?: boolean
  label: React.ReactNode
  /** Accent colour when pressed (defaults to brand accent). */
  tone?: string
  onClick?: () => void
  title?: string
}

// condition toggle (weather, terrain, screens…).
export function TogglePill({ on, label, tone, onClick, title }: TogglePillProps) {
  return (
    <button
      type="button"
      aria-pressed={!!on}
      title={title}
      onClick={onClick}
      style={tone ? cssVars({ "--tone": tone }) : undefined}
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:6px] cursor-pointer border border-solid px-[10px] py-[6px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.06em]",
        "transition-[color,border-color,background] duration-[140ms]",
        on
          ? "border-[color-mix(in_srgb,var(--tone,var(--accent))_55%,transparent)] [--cut-line:color-mix(in_srgb,var(--tone,var(--accent))_55%,transparent)] bg-[color-mix(in_srgb,var(--tone,var(--accent))_11%,transparent)] text-[var(--tone,var(--accent))]"
          : "border-line-2 [--cut-line:var(--line-2)] bg-base text-txt-muted hover:border-line-2 hover:bg-panel-2 hover:text-txt",
      )}
    >
      {label}
    </button>
  )
}
