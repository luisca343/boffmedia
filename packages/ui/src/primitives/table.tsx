import * as React from "react"
import { cn } from "../cn"

export interface TableColumn {
  key: string
  label: React.ReactNode
  numeric?: boolean
}

export interface TableProps {
  columns: TableColumn[]
  rows: Record<string, React.ReactNode>[]
  className?: string
}

export function Table({ columns, rows, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full min-w-[420px] border-collapse bg-panel border border-solid border-line", className)}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              className={cn(
                "font-mono text-[10px] font-semibold leading-none uppercase tracking-[0.14em] text-txt-muted",
                "text-left py-3 px-4 border-b-2 border-solid border-line-2 bg-panel-2",
              )}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="transition-[background] duration-[140ms] hover:bg-panel-2">
            {columns.map((c) => (
              <td
                key={c.key}
                className={cn(
                  "py-3 px-4 border-b border-solid border-line [tr:last-child_&]:border-b-0 text-[15px]",
                  c.numeric && "font-mono text-[13px] font-medium leading-none text-right",
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
