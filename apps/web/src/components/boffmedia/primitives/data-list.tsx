import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

export interface DataRow {
  label: React.ReactNode
  value?: React.ReactNode
  icon?: string
  mono?: boolean
  wide?: boolean
}

export interface DataListProps {
  rows: (DataRow | false | null | undefined)[]
  className?: string
}

export function DataList({ rows, className }: DataListProps) {
  return (
    <dl className={cn("flex flex-col gap-px", className)}>
      {rows.filter(Boolean).map((r, i) => {
        const row = r as DataRow
        return (
          <div
            key={i}
            className={cn(
              "items-baseline py-[7px] border-b border-solid border-line last:border-b-0",
              row.wide ? "grid grid-cols-[1fr] gap-1" : "grid grid-cols-[minmax(88px,38%)_1fr] gap-3",
            )}
          >
            <dt className="inline-flex items-center gap-[6px] font-mono text-[10px] font-semibold leading-[1.3] uppercase tracking-[0.06em] text-txt-dim">
              {row.icon && <Icon name={row.icon} size={13} className="text-txt-muted" />}
              {row.label}
            </dt>
            <dd
              className={cn(
                "font-body text-[13px] font-medium leading-[1.4] text-txt flex gap-[6px] flex-wrap items-center",
                row.wide ? "text-left justify-start" : "text-right justify-end",
                row.mono && "font-mono text-[12px] text-txt-muted",
              )}
            >
              {row.value == null || row.value === "" ? "—" : row.value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
