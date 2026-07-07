import * as React from "react"
import { cn } from "@/lib/utils"

export interface RadioOption {
  value: string
  label: React.ReactNode
  desc?: React.ReactNode
  disabled?: boolean
}

export interface RadioGroupProps {
  value?: string
  onChange?: (value: string) => void
  options?: RadioOption[]
  ariaLabel?: string
  className?: string
}

export function RadioGroup({ value, onChange, options = [], ariaLabel, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2", className)}>
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange?.(o.value)}
            className={cn(
              "group flex items-start gap-[13px] w-full py-3 px-4 text-left cursor-pointer border border-solid",
              "cut",
              "transition-[border-color,background] duration-[140ms]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-2",
              on ? "border-accent bg-accent-soft" : "border-line bg-panel hover:enabled:border-line-2",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex-none grid place-items-center w-[15px] h-[15px] mt-[3px] border border-solid rotate-45",
                "transition-[border-color] duration-[140ms]",
                on ? "border-accent" : "border-line-2",
              )}
            >
              <i
                className={cn(
                  "w-[7px] h-[7px] bg-accent transition-[opacity,transform] duration-[140ms]",
                  on ? "opacity-100" : "opacity-0 scale-[0.4]",
                )}
              />
            </span>
            <span className="grid gap-[3px] min-w-0">
              <b className="font-display text-[14px] font-bold leading-[1.1] tracking-[0.03em] uppercase text-txt">
                {o.label}
              </b>
              {o.desc && <small className="font-body text-[12px] leading-[1.4] text-txt-muted">{o.desc}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
