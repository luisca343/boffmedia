"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface ActivityItemProps {
  icon: string
  text: string
  time: string
  color?: string
}

export function ActivityItem({ icon, text, time, color = "var(--orange-500)" }: ActivityItemProps) {
  return (
    <li className="flex items-center gap-[0.85rem] py-[0.8rem] border-b border-[var(--border)] last:border-b-0 last:pb-0">
      <span
        className="w-[34px] h-[34px] rounded-[var(--radius)] grid place-items-center border shrink-0"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <span className="flex-1 text-sm">{text}</span>
      <span className="text-xs text-[var(--text-dim)] whitespace-nowrap">{time}</span>
    </li>
  )
}
