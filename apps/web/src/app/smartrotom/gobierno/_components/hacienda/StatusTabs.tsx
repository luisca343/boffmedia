"use client"

import { TONES, type Tone } from "../../_utils/tones"

export type StatusTabOption = { value: string; label: string; count: number }

// A small filter strip local to Hacienda's registers — the shared kit has no tabs
// primitive, and one row of literal-toned pills is all a status filter needs here.
export function StatusTabs({
  value,
  onChange,
  options,
  tone = "hacienda",
}: {
  value: string
  onChange: (v: string) => void
  options: StatusTabOption[]
  tone?: Tone
}) {
  const t = TONES[tone]
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-gt-sm border px-3 py-1.5 font-gt text-[12.5px] font-semibold transition-colors ${
              active
                ? `${t.solidBg} ${t.solidBorder} text-white shadow-gt-sm`
                : "border-gt-line-strong bg-gt-paper-0 text-gt-ink-600 hover:bg-gt-paper-1"
            }`}
          >
            {o.label}
            <span
              className={`min-w-[18px] rounded-[9px] px-1.5 py-px text-center font-gt-mono text-[10px] font-bold tabular-nums ${
                active ? "bg-white/20 text-white" : "bg-gt-paper-3 text-gt-ink-500"
              }`}
            >
              {o.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
