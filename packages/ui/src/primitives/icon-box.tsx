import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"

export type IconBoxTone = "accent" | "info" | "ok" | "warn" | "bad" | "muted"
export type IconBoxSize = "sm" | "md" | "lg"

const TONE_VAR: Record<IconBoxTone, string> = {
  accent: "var(--accent)",
  info: "var(--info)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  muted: "var(--muted)",
}

const SIZE: Record<IconBoxSize, string> = {
  sm: "w-7 h-7",
  md: "w-[2.375rem] h-[2.375rem]",
  lg: "w-[3.25rem] h-[3.25rem]",
}

export interface IconBoxProps {
  icon: IconName
  tone?: IconBoxTone
  size?: IconBoxSize
  className?: string
}

export function IconBox({ icon, tone = "accent", size = "md", className }: IconBoxProps) {
  const c = TONE_VAR[tone]
  return (
    <span
      style={{
        color: c,
        // Mixed against --panel rather than transparent: `.cut-frame` paints the
        // fill over the stroke slab, so a translucent one would take its tint.
        ["--cut-fill" as string]: `color-mix(in srgb, ${c} 12%, var(--panel))`,
        ["--cut-line" as string]: `color-mix(in srgb, ${c} 30%, var(--panel))`,
      }}
      className={cn(
        "inline-grid place-items-center flex-none",
        "cut-frame [--cut:6px] [--cut-w:1px]",
        SIZE[size],
        className,
      )}
    >
      <Icon name={icon} size={size === "lg" ? 22 : size === "sm" ? 15 : 18} />
    </span>
  )
}
