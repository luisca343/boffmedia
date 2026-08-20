"use client"

// A small local primitive: the pill-tab status filter used across every urbanismo
// register. Not part of the shared `_components/ui` barrel — it's specific
// to this department's filter rows, so it lives next to the sections that use it.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-0 rounded-gt-sm border border-gt-line-strong bg-gt-paper-2 p-[3px]">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-[4px] px-[13px] py-[6px] font-gt text-[12px] font-bold tracking-[.02em] transition-colors ${
              active ? "bg-gt-paper-0 text-gt-ink-900 shadow-gt-sm" : "text-gt-ink-500 hover:text-gt-ink-800"
            }`}
          >
            {o.label}
            {o.count != null && (
              <span className="ml-1.5 font-gt-mono text-[10px] tabular-nums text-gt-ink-400">{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
