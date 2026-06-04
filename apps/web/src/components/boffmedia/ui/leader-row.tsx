"use client"

import * as React from "react"

interface LeaderRowProps {
  rank: number
  name: string
  pts: number
  you?: boolean
}

export function LeaderRow({ rank, name, pts, you }: LeaderRowProps) {
  const rankColor = rank === 1 ? "var(--orange-500)" : rank === 2 ? "var(--accent-bright)" : rank === 3 ? "var(--purple-400)" : "var(--text-dim)"
  const isTop = rank <= 3
  const rowCls = `flex items-center gap-[0.85rem] py-[0.7rem] border-b border-[var(--border)] last:border-b-0 ${you ? "bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] -mx-4 px-4 rounded-[var(--radius)]" : ""}`

  return (
    <li className={rowCls}>
      <span className="font-mono font-bold text-sm w-[1.7rem]" style={{ color: rankColor }}>
        {String(rank).padStart(2, "0")}
      </span>
      <span
        className="w-[34px] h-[34px] rounded-full grid place-items-center font-display font-bold text-sm shrink-0"
        style={
          isTop
            ? { color: "#fff", background: "linear-gradient(135deg, var(--orange-500), var(--orange-700))", borderColor: "transparent" }
            : { color: "var(--text)", background: "var(--surface-3)", border: "var(--hairline) solid var(--border-strong)" }
        }
      >
        {name[0]}
      </span>
      <span className="flex-1 font-semibold text-sm">{name}</span>
      <span className="font-mono font-bold text-sm">
        {pts.toLocaleString("es")} <span className="text-[var(--text-dim)]">pts</span>
      </span>
    </li>
  )
}
