"use client"

import * as React from "react"
import { Icon } from "@boffmedia/ui"
import { PokemonSprite } from "./ui/PokemonSprite"
import { TypeBadge } from "./ui/TypeBadge"
import { damageColor, type DamageTone } from "./ui/theme"
import type { CalcPokemon, CalcField } from "../_types/calculator"
import { calcAllMoves } from "../_lib/smogonAdapter"
import { useLegalPokemon } from "../_hooks/useLegalPokemon"
import { useCalculatorStore } from "../_store/calculatorStore"

interface Props {
  attackers: CalcPokemon[]
  defenders: CalcPokemon[]
  field: CalcField
  useChampions: boolean
  cornerLabel: string
  emptyLabel: string
}

type Tip = { x: number; y: number; text: string } | null

// damage matrix (attackers × defenders, per move).
export function MatrixGrid({ attackers, defenders, field, useChampions, cornerLabel, emptyLabel }: Props) {
  const { regulation } = useCalculatorStore()
  const legal = useLegalPokemon(regulation)
  const [tip, setTip] = React.useState<Tip>(null)

  const typesOf = (name: string) => legal.find((p) => p.name === name)?.types ?? []

  const matrix = React.useMemo(
    () => attackers.map((a) => defenders.map((d) => calcAllMoves(a, d, field, useChampions))),
    [attackers, defenders, field, useChampions],
  )

  if (!attackers.length || !defenders.length) {
    return (
      <div className="grid place-items-center gap-[0.625rem] border border-dashed border-line-2 px-5 py-[4.375rem] text-center font-body text-[0.8125rem]/[1.5] text-txt-dim">
        <Icon name="grid" size={26} />
        <p>{emptyLabel}</p>
      </div>
    )
  }

  const th = "border border-solid border-line align-top"

  return (
    <div className="max-h-[72vh] overflow-auto border border-solid border-line bg-panel" onMouseLeave={() => setTip(null)}>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-[3] min-w-[9.375rem] border border-solid border-line bg-base-2 p-[0.625rem] text-left font-mono text-[0.5625rem]/[1.3] font-semibold uppercase tracking-[0.1em] text-txt-dim">
              {cornerLabel}
            </th>
            {defenders.map((d, j) => (
              <th key={j} scope="col" className="sticky top-0 z-[2] min-w-[7.375rem] border border-solid border-line bg-base-2 px-3 py-[0.625rem] text-center">
                <PokemonSprite name={d.name} size={34} />
                <span className="my-1 block font-display text-[0.75rem]/[1.2] font-bold uppercase tracking-[0.03em]">{d.name}</span>
                <span className="inline-flex justify-center gap-[3px]">
                  {typesOf(d.name).map((tp) => (
                    <TypeBadge key={tp} type={tp} small />
                  ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attackers.map((a, i) => (
            <tr key={i}>
              <th scope="row" className="sticky left-0 z-[1] min-w-[9.375rem] max-w-[11.875rem] border border-solid border-line bg-base-2 px-[0.625rem] py-2 text-left align-top">
                <div className="mb-[0.375rem] flex items-center gap-[0.4375rem] font-display text-[0.75rem]/[1.15] font-bold uppercase tracking-[0.03em]">
                  <PokemonSprite name={a.name} size={26} />
                  <span>{a.name}</span>
                </div>
                {a.moves.map((m, mi) => (
                  <div key={mi} className="truncate border-t border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-1 font-mono text-[0.625rem]/[1.3] text-txt-muted">
                    {m.name || "—"}
                  </div>
                ))}
              </th>
              {defenders.map((d, j) => (
                <td key={j} className={`${th} px-[0.625rem] py-2`}>
                  <div className="h-[1.875rem]" aria-hidden="true" />
                  {matrix[i][j].map((res, mi) => {
                    const tone: DamageTone = res
                      ? res.minPct >= 100
                        ? "red"
                        : res.minPct * 2 >= 100
                          ? "orange"
                          : res.maxPct * 2 >= 100
                            ? "amber"
                            : "dim"
                      : "dim"
                    const ko = res ? (res.minPct >= 100 ? "OHKO" : res.minPct * 2 >= 100 ? "2HKO" : res.maxPct * 2 >= 100 ? "2HKO?" : "") : ""
                    const c = damageColor(tone)
                    return (
                      <div
                        key={mi}
                        className="my-px flex cursor-default items-center gap-[0.375rem] whitespace-nowrap px-[0.3125rem] py-1 font-mono text-[0.6875rem]/[1.3] font-semibold"
                        style={{ color: c, background: tone !== "dim" ? `color-mix(in srgb, ${c} 12%, transparent)` : "transparent" }}
                        onMouseEnter={res ? (e) => setTip({ x: e.clientX, y: e.clientY, text: res.desc }) : undefined}
                      >
                        {res ? (
                          <>
                            <b>
                              {res.minPct.toFixed(0)}–{res.maxPct.toFixed(0)}%
                            </b>
                            {ko && <span className="text-[0.5625rem] tracking-[0.08em] opacity-85">{ko}</span>}
                          </>
                        ) : (
                          <span className="text-txt-dim">—</span>
                        )}
                      </div>
                    )
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {tip && (
        <div
          className="pointer-events-none fixed z-[90] max-w-[20rem] border border-solid border-line-2 bg-base-deep px-[0.6875rem] py-[0.5625rem] font-mono text-[0.6875rem]/[1.5] text-txt shadow-[var(--shadow)]"
          style={{ left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 330), top: tip.y + 10 }}
        >
          {tip.text}
        </div>
      )}
    </div>
  )
}
