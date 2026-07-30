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
  md: "w-[38px] h-[38px]",
  lg: "w-[52px] h-[52px]",
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
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${c} 30%, transparent)`,
      }}
      className={cn(
        "inline-grid place-items-center flex-none border border-solid",
        "cut [--cut:6px]",
        SIZE[size],
        className,
      )}
    >
      <Icon name={icon} size={size === "lg" ? 22 : size === "sm" ? 15 : 18} />
    </span>
  )
}
