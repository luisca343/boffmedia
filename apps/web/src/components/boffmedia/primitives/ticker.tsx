import * as React from "react"

export interface TickerProps {
  items: string[]
}

export function Ticker({ items }: TickerProps) {
  const doubled = items.concat(items)
  return (
    <div className="relative flex-1 min-w-0 overflow-hidden whitespace-nowrap">
      <div className="inline-block pl-[100%] animate-[bm-tick_38s_linear_infinite] [&_em]:not-italic [&_em]:text-accent">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="mr-11"
            dangerouslySetInnerHTML={{ __html: t + " <em>◆</em>" }}
          />
        ))}
      </div>
    </div>
  )
}
