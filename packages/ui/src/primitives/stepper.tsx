import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface StepperProps {
  steps: string[]
  current: number
  /** Stretch across the container and colour the trail behind the current
   *  step — a page's lifecycle spine rather than an inline progress note.
   *  Labels stay visible at every width in this mode: a rail has the room. */
  rail?: boolean
  /** Dim the whole thing: the process stopped (cancelled, abandoned) and the
   *  badge next to it says why. */
  muted?: boolean
  className?: string
}

/** Linear progress: done = check, active = accent, pending = grey. */
export function Stepper({ steps, current, rail, muted, className }: StepperProps) {
  return (
    <div
      className={cn(
        "items-center",
        rail ? "flex w-full" : "inline-flex shrink-0",
        muted && "opacity-40",
        className,
      )}
      role="list"
    >
      {steps.map((s, i) => {
        const state = !muted && i === current ? "active" : i < current ? "done" : "idle"
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "h-px shrink-0",
                  rail ? "min-w-4 flex-1 mx-1" : "w-[22px]",
                  rail && i <= current && !muted ? "bg-ok" : "bg-line-2",
                )}
              />
            )}
            <span
              role="listitem"
              className={cn(
                "inline-flex items-center gap-2 py-[6px] px-[9px] whitespace-nowrap",
                state === "active" ? "text-txt" : state === "done" ? "text-txt-muted" : "text-txt-dim",
              )}
            >
              <span
                className={cn(
                  "cut-tag cut-tag-edge [--cut-tag:5px] grid place-items-center w-5 h-5 shrink-0 border border-solid",
                  "font-mono text-[10px] font-semibold transition-[background,border-color,color] duration-[140ms]",
                  state === "idle" && "border-line-2 [--cut-line:var(--line-2)] bg-panel text-txt-muted",
                  state === "done" && "text-ok bg-ok-soft border-ok [--cut-line:var(--ok)]",
                  state === "active" && "text-accent-ink bg-accent border-accent [--cut-line:var(--accent)]",
                )}
              >
                {state === "done" ? <Icon name="check" size={11} /> : i + 1}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] tracking-[0.1em] uppercase font-semibold",
                  !rail && "max-[1100px]:hidden",
                )}
              >
                {s}
              </span>
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}
