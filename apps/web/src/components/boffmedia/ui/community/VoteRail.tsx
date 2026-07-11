"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"

// Up/down vote control with a running count. `row` lays it out horizontally.
// Mirrors .cm-vote from comunidad.css. Vote state is controlled by the parent.
export function VoteRail({
  votes = 0,
  vote = 0,
  onVote,
  row,
}: {
  votes?: number
  vote?: number
  onVote?: (v: number) => void
  row?: boolean
}) {
  const total = votes + vote
  const btn = "grid h-[26px] w-[34px] place-items-center border border-solid bg-panel-2 transition-[color,border-color] duration-[140ms] cut-seal [--cut:6px]"
  return (
    <span className={cn("inline-grid justify-items-center gap-[5px]", row && "grid-flow-col items-center")}>
      <button
        type="button"
        aria-label="Votar a favor"
        aria-pressed={vote === 1}
        onClick={(e) => {
          e.stopPropagation()
          onVote && onVote(vote === 1 ? 0 : 1)
        }}
        className={cn(btn, vote === 1 ? "border-accent-line bg-accent-soft text-accent" : "border-line-2 text-txt-dim hover:text-txt")}
      >
        <Icon name="bolt" size={15} />
      </button>
      <span className="font-mono text-[16px]/none font-bold text-txt">{total}</span>
      <button
        type="button"
        aria-label="Votar en contra"
        aria-pressed={vote === -1}
        onClick={(e) => {
          e.stopPropagation()
          onVote && onVote(vote === -1 ? 0 : -1)
        }}
        className={cn(
          btn,
          vote === -1
            ? "border-[color-mix(in_srgb,var(--info)_40%,transparent)] bg-[color:var(--info-soft)] text-[color:var(--info)]"
            : "border-line-2 text-txt-dim hover:text-txt",
        )}
      >
        <Icon name="chevron" size={15} className="rotate-180" />
      </button>
    </span>
  )
}
