"use client"

import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export type SortDir = 1 | -1
export interface SortState {
  key: string
  dir: SortDir
}

export interface TableColumn {
  key: string
  label: React.ReactNode
  /** Right-aligned mono figures. Shorthand for `align: "right"` plus the
   *  numeric type treatment. */
  numeric?: boolean
  align?: "left" | "center" | "right"
  /** Any CSS width — `"64px"`, `"12ch"`, `"20%"`. Unset columns share the rest. */
  width?: string
  /** Extra classes on this column's cells (not the header). */
  className?: string
  /** Visually hidden header text, for an actions column. */
  srOnly?: boolean
  /** Header becomes a sort control. Requires `onSortChange`; the caller keeps
   *  owning the order, so the kit never touches the data. */
  sortable?: boolean
}

export interface TableProps {
  columns: TableColumn[]
  rows: Record<string, React.ReactNode>[]
  /** Tighter cells (py-1.5) and smaller type, sized so a 32px control — an
   *  `sm` Input, Select or Button — sits in a cell without stretching the row.
   *  The default is a reading table; this is a working one. */
  dense?: boolean
  /** Row key. Defaults to the index, which is fine for static rows and wrong
   *  for rows that reorder — pass the record's id then. */
  rowKey?: (row: Record<string, React.ReactNode>, index: number) => React.Key
  /** Controlled sort. The table draws the affordance and reports intent; it
   *  does NOT reorder `rows` — sorting a column may mean comparing something
   *  other than the rendered node, which only the caller knows. */
  sort?: SortState | null
  /** Cycles asc → desc → unsorted, matching what the header arrow shows. */
  onSortChange?: (next: SortState | null) => void
  className?: string
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" }

function nextSort(current: SortState | null | undefined, key: string): SortState | null {
  if (!current || current.key !== key) return { key, dir: 1 }
  return current.dir === 1 ? { key, dir: -1 } : null
}

export function Table({ columns, rows, dense, rowKey, sort, onSortChange, className }: TableProps) {
  const alignOf = (c: TableColumn) => ALIGN[c.align ?? (c.numeric ? "right" : "left")]
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse bg-panel border border-solid border-line",
          !dense && "min-w-[26.25rem]",
          className,
        )}
      >
        <thead>
          <tr>
            {columns.map((c) => {
              const sorted = sort?.key === c.key
              const canSort = c.sortable && onSortChange
              const label = c.srOnly ? <span className="sr-only">{c.label}</span> : c.label
              return (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  aria-sort={sorted ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}
                  className={cn(
                    "font-mono font-semibold leading-none uppercase border-b-2 border-solid border-line-2 bg-panel-2",
                    dense
                      ? "py-2 px-3 text-[0.59375rem] tracking-[0.14em] text-txt-dim"
                      : "py-3 px-4 text-[0.625rem] tracking-[0.14em] text-txt-muted",
                    alignOf(c),
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(nextSort(sort, c.key))}
                      className="inline-flex items-center gap-1.5 uppercase tracking-[inherit] hover:text-txt"
                    >
                      {label}
                      <Icon
                        name="chevron"
                        size={13}
                        className={cn(
                          sorted ? "text-accent" : "text-txt-dim",
                          sorted && sort!.dir === -1 && "[transform:scaleY(-1)]",
                        )}
                      />
                    </button>
                  ) : (
                    label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? rowKey(r, i) : i} className="transition-[background] duration-[140ms] hover:bg-panel-2">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "border-b border-solid border-line [tr:last-child_&]:border-b-0 align-middle",
                    dense ? "py-1.5 px-3 text-[0.8125rem]" : "py-3 px-4 text-[0.9375rem]",
                    c.numeric && "font-mono text-[0.8125rem] font-medium leading-none",
                    alignOf(c),
                    c.className,
                  )}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
