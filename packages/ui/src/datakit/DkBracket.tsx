"use client"

import * as React from "react"

export interface DkBracketRound<M = unknown> {
  phase: React.ReactNode
  matches: M[]
}

// Shared elimination-bracket layout (columns of matches). The caller supplies a
// `renderMatch` for the seat/score chrome. Mirrors `.dk-bracket`.
export function DkBracket<M>({ rounds, renderMatch }: { rounds: DkBracketRound<M>[]; renderMatch: (m: M, ri: number, mi: number) => React.ReactNode }) {
  if (!rounds || !rounds.length) return null
  return (
    <div className="flex items-stretch gap-[1.875rem] overflow-x-auto pb-2.5">
      {rounds.map((rd, ri) => (
        <div key={ri} className="flex w-[15.625rem] flex-none flex-col">
          <div className="pb-2.5 pl-0.5 font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.16em] text-txt-dim">{rd.phase}</div>
          <div className="flex flex-1 flex-col justify-around gap-3.5">
            {rd.matches.map((m, mi) => (
              <div key={mi}>{renderMatch(m, ri, mi)}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
