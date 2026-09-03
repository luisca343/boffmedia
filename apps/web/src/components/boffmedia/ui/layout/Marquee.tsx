import * as React from "react"

export interface MarqueeProps {
  items: string[]
  speed?: number
}

function Half({ items }: { items: string[] }) {
  return (
    <div className="flex flex-none">
      {items.map((it, i) => (
        <span
          key={i}
          className="mr-12 flex items-center gap-12 whitespace-nowrap font-display text-[2.5rem] font-extrabold italic uppercase leading-none tracking-[0.02em] even:text-transparent even:[-webkit-text-stroke:1px_var(--line-2)]"
        >
          {it}
          <i className="not-italic text-[0.8125rem] text-accent [-webkit-text-stroke:0]">◆</i>
        </span>
      ))}
    </div>
  )
}

export function Marquee({ items, speed = 30 }: MarqueeProps) {
  return (
    <div className="overflow-hidden border-y border-line bg-base-2 py-[1.375rem]">
      <div
        className="flex w-max animate-[bm-marquee_var(--mq-dur)_linear_infinite] motion-reduce:animate-none"
        style={{ ["--mq-dur"]: `${speed}s` } as React.CSSProperties}
      >
        <Half items={items} />
        <Half items={items} />
      </div>
    </div>
  )
}
