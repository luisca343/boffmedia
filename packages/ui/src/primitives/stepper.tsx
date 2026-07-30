import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface StepperProps {
  steps: string[]
  current: number
  className?: string
}

/** Linear progress: done = check, active = accent, pending = grey. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div className={cn("inline-flex items-center shrink-0", className)} role="list">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle"
        return (
          <React.Fragment key={s}>
            {i > 0 && <span className="w-[22px] h-px bg-line-2 shrink-0" />}
            <span
              role="listitem"
              className={cn(
                "inline-flex items-center gap-2 py-[6px] px-[9px] whitespace-nowrap",
                state === "active" ? "text-txt" : state === "done" ? "text-txt-muted" : "text-txt-dim",
              )}
            >
              <span
                className={cn(
                  "cut-tag [--cut-tag:5px] grid place-items-center w-5 h-5 shrink-0 border border-solid",
                  "font-mono text-[10px] font-semibold transition-[background,border-color,color] duration-[140ms]",
                  state === "idle" && "border-line-2 bg-panel text-txt-muted",
                  state === "done" && "text-ok bg-ok-soft border-ok",
                  state === "active" && "text-accent-ink bg-accent border-accent",
                )}
              >
                {state === "done" ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase font-semibold max-[1100px]:hidden">
                {s}
              </span>
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}
