"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface MarqueeProps {
  items: string[]
  repeat?: number
  icon?: string
}

export function Marquee({ items, repeat = 2, icon = "bolt" }: MarqueeProps) {
  return (
    <div className="overflow-hidden border-y border-edge py-[0.85rem] bg-layer-1" aria-hidden="true">
      <div className="flex w-max dsh-marquee-track">
        {Array.from({ length: repeat }).map((_, i) => (
          <span key={i} className="flex">
            {items.map((t) => (
              <span key={t} className="inline-flex items-center gap-[0.5rem] font-mono text-sm font-semibold tracking-[0.1em] text-ink-muted px-7">
                {icon && <Icon name={icon} size={12} className="text-[var(--orange-500)]" />}
                {t}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
