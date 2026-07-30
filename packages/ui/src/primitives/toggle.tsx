import * as React from "react"
import { cn } from "../cn"

export interface ToggleProps {
  on?: boolean
  onChange?: (on: boolean) => void
  label?: React.ReactNode
  className?: string
}

export function Toggle({ on, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!on}
      onClick={() => onChange?.(!on)}
      className={cn("inline-flex items-center gap-3 cursor-pointer", className)}
    >
      <span
        className={cn(
          "relative w-[42px] h-[22px] border border-solid transition-[background,border-color] duration-[140ms]",
          "cut [--cut:6px]",
          on ? "bg-accent-soft border-accent" : "bg-panel-2 border-line-2",
        )}
      >
        <i
          className={cn(
            "absolute top-[3px] w-[14px] h-[14px] transition-[left,background] duration-[140ms]",
            "cut [--cut:3px]",
            on ? "left-[22px] bg-accent" : "left-1 bg-txt-muted",
          )}
        />
      </span>
      {label && (
        <span
          className={cn(
            "font-mono text-[12px] font-semibold leading-none uppercase tracking-[0.08em]",
            on ? "text-txt" : "text-txt-muted",
          )}
        >
          {label}
        </span>
      )}
    </button>
  )
}
