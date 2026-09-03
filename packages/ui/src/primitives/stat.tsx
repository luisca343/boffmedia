import * as React from "react"
import { cn } from "../cn"

export interface StatItem {
  n: React.ReactNode
  l: string
}

export function Stats({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div className={cn("flex w-max border border-solid border-line bg-panel", className)}>
      {items.map((s, i) => (
        <div key={i} className="border-r border-line px-7 py-4 last:border-r-0">
          <span className="block font-display text-[2.375rem] font-extrabold italic leading-none [&_b]:text-accent [&_em]:text-accent">
            {s.n}
          </span>
          <span className="mt-2 block font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.14em] text-txt-muted">
            {s.l}
          </span>
        </div>
      ))}
    </div>
  )
}
