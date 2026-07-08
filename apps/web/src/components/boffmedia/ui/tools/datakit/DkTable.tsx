import * as React from "react"
import { cn } from "@/lib/utils"

export interface DkColumn {
  key: string
  label?: React.ReactNode
  w?: number | string
  align?: "left" | "right" | "center"
  sortable?: boolean
}

export interface DkTableProps {
  columns: DkColumn[]
  children: React.ReactNode
  sortKey?: string
  sortDir?: "asc" | "desc"
  onSort?: (key: string) => void
  minWidth?: string
  ariaLabel?: string
  className?: string
}

// `.dk-table` td/th chrome, replicated via child selectors so callers write
// plain <tr>/<td>. Add `mono` to a <td> for the mono cell treatment and
// `is-click` to a <tr> for the clickable-row hover.
const TABLE_CHROME = cn(
  "w-full border-collapse",
  "[&_td]:border-b [&_td]:border-solid [&_td]:border-[color-mix(in_srgb,var(--line)_60%,transparent)] [&_td]:px-3 [&_td]:py-[9px] [&_td]:align-middle [&_td]:font-body [&_td]:text-[13px] [&_td]:font-medium [&_td]:leading-[1.35]",
  "[&_tbody_tr:last-child>td]:border-b-0",
  "[&_td.mono]:font-mono [&_td.mono]:text-[12px] [&_td.mono]:font-semibold",
  "[&_tr.is-click]:cursor-pointer [&_tr.is-click]:transition-colors [&_tr.is-click:hover]:bg-panel-2",
)

export function DkTable({ columns, children, sortKey, sortDir, onSort, minWidth, ariaLabel, className }: DkTableProps) {
  return (
    <div className={cn("overflow-auto border border-solid border-line bg-panel", className)}>
      <table style={{ minWidth }} aria-label={ariaLabel} className={TABLE_CHROME}>
        <thead>
          <tr>
            {columns.map((c) => {
              const on = sortKey === c.key
              return (
                <th
                  key={c.key}
                  style={{ width: c.w, textAlign: c.align }}
                  className="sticky top-0 z-[2] whitespace-nowrap border-b border-solid border-line-2 bg-base-2 px-3 py-[10px] text-left font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-txt-dim"
                >
                  {c.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-[5px] border-0 bg-transparent p-0 font-[inherit] uppercase tracking-[inherit] transition-colors",
                        on ? "text-txt" : "text-txt-dim hover:text-txt",
                      )}
                    >
                      {c.label}
                      <span className={cn("text-[8px]", on ? "text-accent-bright" : "text-txt-dim")}>{on ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  )
}
