"use client"

// A row of filter tabs with counts — used above the Denuncias register. Local to Seguridad
// because no such primitive exists in the shared `ui/` barrel yet; the tone-to-class mapping
// still goes through `TONES` so no class name is ever built dynamically.
import { TONES, type Tone } from "../../_utils/tones"

export function Segmented({
  value,
  onChange,
  options,
  tone = "seguridad",
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; count: number }[]
  tone?: Tone
}) {
  const t = TONES[tone]
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="tablist">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-2 rounded-gt-sm border px-3 py-[7px] font-gt text-[12.5px] font-semibold transition-colors ${
              on
                ? `${t.softBg} ${t.softBorder} ${t.text}`
                : "border-gt-line bg-gt-paper-0 text-gt-ink-500 hover:bg-gt-paper-1 hover:text-gt-ink-800"
            }`}
          >
            {o.label}
            <span
              className={`min-w-[18px] rounded-[9px] px-1.5 py-px text-center font-gt-mono text-[10px] font-bold tabular-nums ${
                on ? `${t.solidBg} text-white` : "bg-gt-paper-3 text-gt-ink-500"
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
