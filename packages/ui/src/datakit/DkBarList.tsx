import * as React from "react"
import { cn } from "../cn"

export interface DkBarItem {
  name: React.ReactNode
  pct: number
  lead?: React.ReactNode
  color?: string
  onClick?: () => void
}

/** Ranked list of labelled bars (moves, items, abilities, partners…). */
export function DkBarList({ items, max, empty }: { items: DkBarItem[]; max?: number; empty?: React.ReactNode }) {
  const shown = max != null ? items.slice(0, max) : items
  if (!shown.length) return <p className="py-2 font-mono text-[12px] leading-[1.5] text-txt-dim">{empty ?? "—"}</p>
  const peak = Math.max(...shown.map((i) => i.pct), 0.0001)

  return (
    <div className="grid">
      {shown.map((it, i) => {
        const row = (
          <>
            {it.lead}
            <span className="min-w-0 flex-1 truncate font-body text-[12px] leading-[1.25] text-txt transition-colors">{it.name}</span>
            <span className="h-[5px] w-[74px] flex-none overflow-hidden border border-solid border-line bg-base" aria-hidden="true">
              <i className="block h-full opacity-75" style={{ width: `${(it.pct / peak) * 100}%`, background: it.color ?? "var(--accent)" }} />
            </span>
            <span className="w-[56px] flex-none text-right font-mono text-[11px] font-semibold leading-none text-txt-muted">
              {it.pct.toFixed(1)}%
            </span>
          </>
        )
        const base = "flex w-full min-w-0 items-center gap-[9px] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-[5px] last:border-b-0"
        return it.onClick ? (
          <button key={i} type="button" onClick={it.onClick} className={cn(base, "cursor-pointer border-x-0 border-t-0 bg-transparent text-left [&:hover_span]:text-accent-bright")}>
            {row}
          </button>
        ) : (
          <div key={i} className={base}>
            {row}
          </div>
        )
      })}
    </div>
  )
}
