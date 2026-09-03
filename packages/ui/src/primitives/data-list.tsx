import * as React from "react"
import { cn } from "../cn"
import { Icon, type IconName } from "./icon"

export interface DataRow {
  label: React.ReactNode
  value?: React.ReactNode
  icon?: IconName
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
              "items-baseline py-[0.4375rem] border-b border-solid border-line last:border-b-0",
              row.wide ? "grid grid-cols-[1fr] gap-1" : "grid grid-cols-[minmax(5.5rem,38%)_1fr] gap-3",
            )}
          >
            <dt className="inline-flex items-center gap-[0.375rem] font-mono text-[0.625rem] font-semibold leading-[1.3] uppercase tracking-[0.06em] text-txt-dim">
              {row.icon && <Icon name={row.icon} size={13} className="text-txt-muted" />}
              {row.label}
            </dt>
            <dd
              className={cn(
                "font-body text-[0.8125rem] font-medium leading-[1.4] text-txt flex gap-[0.375rem] flex-wrap items-center",
                row.wide ? "text-left justify-start" : "text-right justify-end",
                row.mono && "font-mono text-[0.75rem] text-txt-muted",
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
