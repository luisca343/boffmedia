"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind?: "new" | "soon" | "live" | "accent" | "neutral"
}

const kindStyles: Record<string, string> = {
  new: "text-orange-400",
  soon: "text-purple-400",
  live: "text-emerald-400",
  accent: "text-[var(--accent-bright)]",
  neutral: "",
}

const kindBorders: Record<string, string> = {
  new: "color-mix(in srgb, var(--orange-500) 45%, transparent)",
  soon: "color-mix(in srgb, var(--purple-500) 45%, transparent)",
  live: "color-mix(in srgb, var(--emerald-500) 45%, transparent)",
  accent: "color-mix(in srgb, var(--accent) 45%, transparent)",
  neutral: "var(--border-strong)",
}

const kindBgs: Record<string, string> = {
  new: "color-mix(in srgb, var(--orange-500) 12%, transparent)",
  soon: "color-mix(in srgb, var(--purple-500) 12%, transparent)",
  live: "color-mix(in srgb, var(--emerald-500) 12%, transparent)",
  accent: "var(--accent-soft)",
  neutral: "var(--surface-2)",
}

export function BoffBadge({ className, kind, children, ...props }: BoffBadgeProps) {
  const base = cn(
    "inline-flex items-center gap-1",
    "text-[0.68rem] font-semibold tracking-[0.08em] uppercase",
    "py-1 px-2.5",
    "border border-solid",
    kind && kindStyles[kind],
    className,
  )

  const style: React.CSSProperties = {
    fontFamily: "var(--label-font, var(--font-mono))",
    borderRadius: "var(--radius-pill, 9999px)",
    borderColor: kind ? kindBorders[kind] : "var(--border-strong)",
    color: kind ? undefined : "var(--text-muted)",
    background: kind ? kindBgs[kind] : "var(--surface-2)",
  }

  return (
    <span className={base} style={style} {...props}>
      {(kind === "live" || kind === "new") && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full bg-current",
          kind === "live" && "animate-pulse-dot",
        )} />
      )}
      {children}
    </span>
  )
}
