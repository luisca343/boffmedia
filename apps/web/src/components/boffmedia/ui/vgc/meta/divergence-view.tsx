"use client"

import { useState, useMemo } from "react"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { ToolTable } from "@/components/boffmedia/primitives/tool-table"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import { EmptyState } from "@/components/boffmedia/primitives/empty-state"

interface DivergenceRow {
  id: string
  ladder: number
  tournament: number
  delta: number
  absDelta: number
  badge: string | null
}

interface DivergenceResult {
  rows: DivergenceRow[]
  ladderFormat: string
  ladderMonth: string
  rowCount: number
}

interface DivergenceViewProps {
  result: DivergenceResult | null
  pokeMap: Record<string, { id: string; name: string; dex: number }>
}

export function VgcDivergenceView({ result, pokeMap }: DivergenceViewProps) {
  const [sortKey, setSortKey] = useState("delta")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const onSort = (k: string) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(k)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    if (!result) return []
    const sign = sortDir === "desc" ? -1 : 1
    return [...result.rows].sort((a, b) => {
      if (sortKey === "ladder") return sign * (a.ladder - b.ladder)
      if (sortKey === "tournament") return sign * (a.tournament - b.tournament)
      return sign * (a.absDelta - b.absDelta)
    })
  }, [result, sortKey, sortDir])

  if (!result || !result.rows.length) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-[var(--text-dim)] p-8">
        <EmptyState icon="chart" title="Sin datos de divergencia" sub="No hay suficiente información para comparar ladder y torneo." />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center gap-2 px-[0.85rem] py-2 border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
        <span className="font-mono px-1.5 py-[0.15rem] rounded-[var(--radius-pill)] border border-[var(--border)] text-[var(--text-dim)]">
          Smogon
        </span>
        <span className="font-mono text-[var(--text)]">{result.ladderFormat}</span>
        <span className="text-[var(--text-dim)]">·</span>
        <span>{result.ladderMonth}</span>
        <span className="text-[var(--text-dim)]">·</span>
        <span>1630+ ELO</span>
        <span className="font-mono text-[var(--text-dim)] ml-auto">{result.rowCount} Pokémon</span>
      </div>
      <ToolTable
        minWidth="620px"
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        columns={[
          { key: "n", label: "#", w: 40 },
          { key: "pk", label: "Pokémon" },
          { key: "ladder", label: "Ladder", w: 104, align: "right", sortable: true },
          { key: "tournament", label: "Torneo", w: 104, align: "right", sortable: true },
          { key: "delta", label: "Δ", w: 84, align: "right", sortable: true },
          { key: "badge", label: "", w: 150 },
        ]}
      >
        <tbody>
          {sorted.map((row, i) => {
            const p = pokeMap[row.id]
            const pos = row.delta > 0
            return (
              <tr key={row.id} className="transition-colors hover:bg-[color-mix(in_srgb,var(--surface-3)_45%,transparent)]">
                <td className="font-mono text-[var(--text-dim)] text-right py-3 px-4 border-b border-[var(--border)] text-sm">{i + 1}</td>
                <td className="py-3 px-4 border-b border-[var(--border)]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text)] text-sm">
                    {p ? (
                      <>
                        <img src={spriteUrl(p.name)} alt={p.name} width={30} height={30} className="object-contain shrink-0" onError={handleSpriteError} />
                        <span>{p.name}</span>
                      </>
                    ) : (
                      row.id
                    )}
                  </span>
                </td>
                <td className="font-mono text-[var(--text-muted)] text-right py-3 px-4 border-b border-[var(--border)] text-sm">
                  {row.ladder.toFixed(1)}%
                </td>
                <td className="font-mono text-[var(--text-muted)] text-right py-3 px-4 border-b border-[var(--border)] text-sm">
                  {row.tournament.toFixed(1)}%
                </td>
                <td
                  className="font-mono font-bold text-right py-3 px-4 border-b border-[var(--border)] text-sm"
                  style={{ color: pos ? "#f5b342" : "#5b9cf0" }}
                >
                  {pos ? "+" : ""}{row.delta.toFixed(1)}%
                </td>
                <td className="py-3 px-4 border-b border-[var(--border)]">
                  {row.badge === "ladder-trap" ? (
                    <span
                      className="inline-flex text-[10px] font-bold px-2 py-[0.16rem] rounded-[var(--radius)] border"
                      style={{
                        color: "#f5b342",
                        borderColor: "color-mix(in srgb, #f5b342 35%, transparent)",
                        background: "color-mix(in srgb, #f5b342 14%, transparent)",
                      }}
                    >
                      Trampa de ladder
                    </span>
                  ) : row.badge === "tournament-staple" ? (
                    <span
                      className="inline-flex text-[10px] font-bold px-2 py-[0.16rem] rounded-[var(--radius)] border"
                      style={{
                        color: "#5b9cf0",
                        borderColor: "color-mix(in srgb, #5b9cf0 35%, transparent)",
                        background: "color-mix(in srgb, #5b9cf0 14%, transparent)",
                      }}
                    >
                      Pilar de torneo
                    </span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </ToolTable>
    </div>
  )
}
