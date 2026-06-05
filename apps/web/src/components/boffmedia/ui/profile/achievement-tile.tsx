"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"

interface AchievementTileProps {
  icon: string
  name: string
  done?: boolean
}

export function AchievementTile({ icon, name, done = false }: AchievementTileProps) {
  return (
    <div
      className="flex flex-col items-center gap-[0.5rem] text-center p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]"
      style={{ opacity: done ? 1 : 0.5 }}
    >
      <span
        className="w-11 h-11 rounded-full grid place-items-center border"
        style={
          done
            ? { color: "var(--orange-500)", background: "color-mix(in srgb, var(--orange-500) 14%, transparent)", borderColor: "color-mix(in srgb, var(--orange-500) 35%, transparent)" }
            : { color: "var(--text-dim)", background: "var(--surface-3)", borderColor: "var(--border-strong)" }
        }
      >
        <Icon name={done ? icon : "shield"} size={20} />
      </span>
      <span className="text-xs font-semibold leading-[1.3]">{name}</span>
    </div>
  )
}
