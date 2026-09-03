import { TONES, type Tone } from "../../_utils/tones"

// A small local control (not a global `ui/` primitive): a row of filter chips with an
// optional live count. Used by Censo (standing) and Auditoría (department) — both filters
// are single-select over a short, known set of values.
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  tone = "accent",
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
  tone?: Tone
}) {
  const t = TONES[tone]
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-gt-sm border px-3 py-1.5 font-gt text-[0.78125rem] font-semibold transition-colors ${
              active
                ? `${t.softBorder} ${t.softBg} ${t.text}`
                : "border-gt-line-strong bg-gt-paper-0 text-gt-ink-600 hover:bg-gt-paper-1"
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={`rounded-gt-pill px-1.5 py-px font-gt-mono text-[0.625rem] font-bold tabular-nums ${
                  active ? `${t.solidBg} text-white` : "bg-gt-paper-3 text-gt-ink-500"
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
