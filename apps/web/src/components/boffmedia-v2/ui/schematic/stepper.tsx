"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { SchIcon } from "./sch-icon"

export interface StepperProps {
  steps: string[]
  current: number
}

// Linear progress indicator. Completed steps get a green check, the active one
// the accent, pending ones grey. Mono labels collapse below 1100px to just nums.
export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="inline-flex items-center shrink-0" role="list">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle"
        return (
          <Fragment key={s}>
            {i > 0 && <span className="w-[22px] h-px bg-edge-strong shrink-0" />}
            <span
              role="listitem"
              className={cn(
                "inline-flex items-center gap-2 py-[0.3rem] px-[0.55rem] whitespace-nowrap",
                state === "active" ? "text-ink" : state === "done" ? "text-ink-muted" : "text-ink-dim",
              )}
            >
              <span
                className={cn(
                  "grid place-items-center w-5 h-5 shrink-0 rounded-full border",
                  "font-mono text-[10px] font-bold transition-all duration-[var(--dur)] ease-[var(--ease)]",
                  state === "idle" && "border-edge-strong text-ink-dim",
                  state === "done" &&
                    "text-[color:var(--emerald-400)] bg-[color-mix(in_srgb,var(--emerald-500)_18%,transparent)] border-[color-mix(in_srgb,var(--emerald-500)_50%,transparent)]",
                  state === "active" && "text-[color:var(--on-accent)] bg-[var(--accent)] border-[var(--accent)]",
                )}
                style={state === "active" ? { boxShadow: "0 0 40px -8px var(--accent)" } : undefined}
              >
                {state === "done" ? <SchIcon name="check" size={11} stroke={2.6} /> : i + 1}
              </span>
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase font-semibold max-[1100px]:hidden">
                {s}
              </span>
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}
