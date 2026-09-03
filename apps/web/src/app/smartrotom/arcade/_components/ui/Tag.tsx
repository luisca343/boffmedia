import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ArTone = "cyan" | "magenta" | "violet" | "amber" | "lime" | "ghost"

export interface ArTagProps {
  children: ReactNode
  tone?: ArTone
  size?: "sm" | "md" | "lg"
  className?: string
}

const TONE: Record<ArTone, string> = {
  cyan: "bg-ar-cyan/[.12] text-ar-cyan border-ar-cyan/45",
  magenta: "bg-ar-magenta/[.14] text-ar-magenta-2 border-ar-magenta/50",
  violet: "bg-ar-violet/[.16] text-ar-violet-2 border-ar-violet/50",
  amber: "bg-ar-amber/[.16] text-ar-amber border-ar-amber/55",
  lime: "bg-ar-lime/[.14] text-ar-lime border-ar-lime/50",
  ghost: "bg-white/5 text-ar-ink-dim border-white/[.12]",
}

const SIZE = {
  sm: "px-[0.4375rem] py-[3px] text-[0.625rem]",
  md: "px-[0.5625rem] py-1 text-[0.6875rem]",
  lg: "px-[0.6875rem] py-[0.3125rem] text-[0.75rem]",
} as const

export function Tag({ children, tone = "cyan", size = "sm", className }: ArTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[5px] border",
        "font-ar-mono font-bold uppercase tracking-[0.08em]",
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
