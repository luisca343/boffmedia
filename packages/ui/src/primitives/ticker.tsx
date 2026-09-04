import * as React from "react"

export interface TickerProps {
  items: string[]
}

export function Ticker({ items }: TickerProps) {
  const doubled = items.concat(items)
  return (
    <div className="relative flex-1 min-w-0 overflow-hidden whitespace-nowrap">
      <div className="inline-block pl-[100%] animate-[bm-tick_38s_linear_infinite] motion-reduce:animate-none [&_em]:not-italic [&_em]:text-accent">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="mr-11"
            // Not sanitized on purpose: `items` is a fixed headline list the host
            // passes in (i18n values in `TopBar`), never user input. The HTML is
            // the point — an `<em>` inside a value is how a headline styles a word.
            // If a caller ever feeds this from the database, sanitize at that
            // caller: this package must stay host-agnostic and dependency-free.
            dangerouslySetInnerHTML={{ __html: t + " <em>◆</em>" }}
          />
        ))}
      </div>
    </div>
  )
}
