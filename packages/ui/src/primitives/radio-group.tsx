import * as React from "react"
import { cn } from "../cn"
import { useRoving } from "./roving"

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

/** Single choice from a short list.
 *
 *  Rows are unboxed: a bordered card per option made the list read as a stack of
 *  cards and cost 61px a row, most of it chrome for options the reader has
 *  already rejected. Only the CHOSEN row is painted — accent bar, soft tint,
 *  filled diamond — so the selection is what carries the ink. */
export function RadioGroup({ value, onChange, options = [], ariaLabel, className }: RadioGroupProps) {
  const roving = useRoving(
    options.length,
    (i) => options[i]?.value === value,
    (i) => !!options[i]?.disabled,
  )
  const pick = (i: number) => {
    const o = options[i]
    if (o && !o.disabled) onChange?.(o.value)
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid", className)}>
      {options.map((o, i) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            ref={roving.setRef(i)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={roving.tabIndex(i)}
            disabled={o.disabled}
            onClick={() => pick(i)}
            onKeyDown={(e) => roving.onKeyDown(e, i, pick)}
            className={cn(
              "group relative flex w-full items-start gap-[10px] py-[8px] pr-3 pl-[11px] text-left cursor-pointer",
              // The accent bar is a left border that is always laid out and only
              // coloured when chosen, so selecting a row cannot shift the text.
              "border-0 border-l-[3px] border-solid border-l-transparent bg-transparent",
              "transition-[background,border-color] duration-[140ms]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // A ring, not an outline: these rows sit flush against each other,
              // so an offset outline would overlap its neighbours.
              "outline-none focus-visible:bg-accent-soft focus-visible:border-l-accent-line",
              on ? "border-l-accent bg-accent-soft" : "hover:enabled:bg-panel-2",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                // Centred against the label's own line box (13px x 1.15 ≈ 15px)
                // rather than nudged down by a hardcoded margin.
                "flex-none grid place-items-center w-[13px] h-[13px] mt-[1px] self-start border border-solid rotate-45",
                "transition-[border-color] duration-[140ms]",
                // `group-[&:enabled:hover]`, not `group-hover:enabled`: the
                // latter compiles to `:enabled` on this span, which is not a
                // form control, so it would never match.
                on ? "border-accent" : "border-line-2 group-[&:enabled:hover]:border-txt-dim",
              )}
            >
              <i
                className={cn(
                  "w-[6px] h-[6px] bg-accent transition-[opacity,transform] duration-[140ms]",
                  on ? "opacity-100" : "opacity-0 scale-[0.4]",
                )}
              />
            </span>
            <span className="grid gap-[2px] min-w-0">
              <b
                className={cn(
                  "font-display text-[13px] font-bold leading-[1.15] tracking-[0.03em] uppercase",
                  "transition-[color] duration-[140ms]",
                  on ? "text-txt" : "text-txt-muted group-[&:enabled:hover]:text-txt",
                )}
              >
                {o.label}
              </b>
              {o.desc && <small className="font-body text-[11.5px] leading-[1.35] text-txt-dim">{o.desc}</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
