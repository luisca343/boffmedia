"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface LinkedRowProps {
  icon: string
  iconClass?: string
  name: string
  sub: string
  end: React.ReactNode
}

export function LinkedRow({ icon, iconClass, name, sub, end }: LinkedRowProps) {
  const iconBg = iconClass === "discord" ? "#5865f2" : iconClass === "mc" ? "linear-gradient(135deg, var(--emerald-500), #047857)" : iconClass === "steam" ? "linear-gradient(135deg, var(--cyan-500), var(--cyan-600))" : "var(--surface-3)"

  return (
    <div className="flex items-center gap-[0.9rem] p-[0.85rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]">
      <span
        className="w-[42px] h-[42px] rounded-[var(--radius)] grid place-items-center text-white shrink-0"
        style={{ background: iconBg }}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1 flex flex-col">
        <span className="font-semibold text-sm">{name}</span>
        <span className="text-xs text-[var(--text-muted)]">{sub}</span>
      </div>
      {end}
    </div>
  )
}
