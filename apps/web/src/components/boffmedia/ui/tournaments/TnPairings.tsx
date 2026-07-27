"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import { TnEntrant } from "./TnEntrant"
import type { TnMatch } from "./tournaments-util"

export interface TnPairingRound {
  round: number
  matches: TnMatch[]
}

/**
 * Swiss / league round pairings as a table (Mesa · local · resultado ·
 * visitante) — far clearer than the elimination bracket layout. A round
 * selector defaults to the latest round; a single round hides it.
 */
export function TnPairings({ rounds }: { rounds: TnPairingRound[] }) {
  const t = useTranslations("torneos.pairings")
  const valid = rounds.filter((r) => r.matches.length > 0)
  const [sel, setSel] = React.useState<number | null>(null)
  if (valid.length === 0) return null

  const active = valid.find((r) => r.round === sel) ?? valid[valid.length - 1]
  const th =
    "px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-txt-dim"
  const td = "px-3 py-2 align-middle"

  return (
    <div className="grid gap-3">
      {valid.length > 1 && (
        <DkSeg
          size="sm"
          value={String(active.round)}
          onChange={(v) => setSel(Number(v))}
          ariaLabel={t("roundAriaLabel")}
          options={valid.map((r) => ({ value: String(r.round), label: t("roundOption", { round: r.round }) }))}
        />
      )}
      <div className="overflow-x-auto border border-solid border-line bg-panel">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className={cn(th, "w-12 text-center")}>{t("colTable")}</th>
              <th className={cn(th, "text-right")}>{t("colHome")}</th>
              <th className={cn(th, "w-20 text-center")}>{t("colResult")}</th>
              <th className={cn(th, "text-left")}>{t("colAway")}</th>
            </tr>
          </thead>
          <tbody>
            {active.matches.map((m, i) => {
              const bye = m.bot == null
              const topWin = m.winner != null && m.winner === m.top
              const botWin = m.winner != null && m.winner === m.bot
              return (
                <tr key={i} className="border-b border-line last:border-b-0">
                  <td className={cn(td, "text-center font-mono text-[11px] text-txt-dim")}>{i + 1}</td>
                  <td className={cn(td, "text-right")}>
                    <span className="inline-flex justify-end">
                      <TnEntrant c={m.top} align="right" win={topWin} lose={botWin} compact />
                    </span>
                  </td>
                  <td className={cn(td, "text-center")}>
                    <ScoreCell m={m} bye={bye} />
                  </td>
                  <td className={td}>
                    {bye ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-txt-dim">
                        {t("bye")}
                      </span>
                    ) : (
                      <TnEntrant c={m.bot} align="left" win={botWin} lose={topWin} compact />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScoreCell({ m, bye }: { m: TnMatch; bye: boolean }) {
  const t = useTranslations("torneos.pairings")
  const tEntrant = useTranslations("torneos.entrant")
  if (bye) return <span className="font-mono text-[11px] font-bold text-ok">{tEntrant("bye")}</span>
  if (m.status === "final") {
    return (
      <span className="whitespace-nowrap font-mono text-[13px] font-bold tabular-nums">
        <span className={m.winner === m.top ? "text-accent-bright" : "text-txt-muted"}>{m.g1 ?? 0}</span>
        <i className="px-0.5 not-italic text-txt-dim">–</i>
        <span className={m.winner === m.bot ? "text-accent-bright" : "text-txt-muted"}>{m.g2 ?? 0}</span>
      </span>
    )
  }
  if (m.status === "playing")
    return <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-warn">{t("playing")}</span>
  return <span className="font-mono text-[11px] text-txt-dim">{t("vs")}</span>
}
