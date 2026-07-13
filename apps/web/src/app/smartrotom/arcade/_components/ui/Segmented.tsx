"use client"

import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-lg border border-white/[.08] bg-black/40 p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "ar-lift rounded-md border px-3 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em]",
              active
                ? "border-ar-cyan/40 bg-ar-cyan/[.18] text-ar-cyan"
                : "border-transparent text-ar-ink-dim hover:text-ar-ink",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
