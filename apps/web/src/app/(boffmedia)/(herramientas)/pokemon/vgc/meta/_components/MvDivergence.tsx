"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { DkTable, DkSprite, DkEmpty, DkSkelList } from "@/components/boffmedia/ui/tools/datakit"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import type { DivergenceResult, PokeData } from "../_lib/meta-types"

interface MvDivergenceProps {
  result: DivergenceResult | null
  pokeMap: Record<string, PokeData>
  loading?: boolean
}

export function MvDivergence({ result, pokeMap, loading }: MvDivergenceProps) {
  const t = useTranslations("vgc.meta")
  const [sortKey, setSortKey] = useState("delta")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else {
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

  if (loading) {
    return (
      <div className="grid content-start gap-3">
        <DkSkelList rows={12} h={40} />
      </div>
    )
  }

  if (!result || result.rows.length === 0) {
    return <DkEmpty icon="chart" title={t("divergence.emptyTitle")} lead={t("divergence.selectTournament")} />
  }

  return (
    <div className="grid content-start gap-3">
      <div className="flex flex-wrap items-center gap-[9px] border border-solid border-line bg-panel px-3 py-[9px] font-mono text-[11.5px] leading-[1.5] text-txt-muted">
        <Icon name="info" size={13} className="flex-none text-signal" />
        <span>
          {t.rich("divergence.note", {
            b: (chunks) => <b className="text-txt">{chunks}</b>,
            format: result.ladderFormat,
            month: result.ladderMonth,
          })}
        </span>
        <span className="ml-auto text-txt-dim">{t("divergence.rowCount", { count: result.rowCount })}</span>
      </div>

      <DkTable
        minWidth="640px"
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        ariaLabel={t("aria.divergence")}
        columns={[
          { key: "n", label: "#", w: 44 },
          { key: "pk", label: t("divergence.col.pokemon") },
          { key: "ladder", label: t("divergence.col.ladder"), w: 100, align: "right", sortable: true },
          { key: "tournament", label: t("divergence.col.tournament"), w: 100, align: "right", sortable: true },
          { key: "delta", label: "Δ", w: 84, align: "right", sortable: true },
          { key: "badge", label: "", w: 150 },
        ]}
      >
        <tbody>
          {sorted.map((row, i) => {
            const p = pokeMap[row.id]
            const pos = row.delta > 0
            return (
              <tr key={row.id}>
                <td className="mono text-txt-dim">{i + 1}</td>
                <td>
                  <span className="inline-flex items-center gap-[9px] font-semibold">
                    {p ? (
                      <>
                        <DkSprite src={spriteUrl(p.name)} alt={p.name} size={28} onError={handleSpriteError} />
                        {p.name}
                      </>
                    ) : (
                      row.id
                    )}
                  </span>
                </td>
                <td className="mono text-right text-txt-muted">{row.ladder.toFixed(1)}%</td>
                <td className="mono text-right text-txt-muted">{row.tournament.toFixed(1)}%</td>
                <td className="mono text-right font-bold" style={{ color: pos ? "var(--warn)" : "var(--signal)" }}>
                  {pos ? "+" : ""}
                  {row.delta.toFixed(1)}%
                </td>
                <td>
                  {row.badge === "ladder-trap" && (
                    <Badge tone="signal">{t("divergence.badges.ladderTrap")}</Badge>
                  )}
                  {row.badge === "tournament-staple" && (
                    <Badge tone="warn">{t("divergence.badges.tournamentStaple")}</Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </DkTable>
    </div>
  )
}

function Badge({ tone, children }: { tone: "signal" | "warn"; children: React.ReactNode }) {
  const style =
    tone === "signal"
      ? { color: "var(--signal)", background: "color-mix(in srgb, var(--signal) 12%, transparent)", borderColor: "color-mix(in srgb, var(--signal) 35%, transparent)" }
      : { color: "var(--warn)", background: "color-mix(in srgb, var(--warn) 12%, transparent)", borderColor: "color-mix(in srgb, var(--warn) 35%, transparent)" }
  return (
    <span
      className="inline-flex whitespace-nowrap border border-solid px-[7px] py-1 font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.1em] [clip-path:polygon(2px_0,100%_0,calc(100%_-_2px)_100%,0_100%)]"
      style={style}
    >
      {children}
    </span>
  )
}
