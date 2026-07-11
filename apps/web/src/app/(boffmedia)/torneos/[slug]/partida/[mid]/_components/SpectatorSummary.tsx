"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { TM_CARD, TM_CARD_HEAD, TM_CARD_H3 } from "@/components/boffmedia/ui/tournaments"
import { type TnCompetitorApi, type TnMatchDetailApi } from "@/services/api/boffmedia/tournamentsService"
import { LiveMatchChat } from "./LiveMatchChat"

export function SpectatorSummary({
  detail,
  showChat,
  onChanged,
}: {
  detail: TnMatchDetailApi
  showChat: boolean
  onChanged: () => void
}) {
  const done = detail.status === "completed" || detail.status === "bye"
  const line = (c: TnCompetitorApi | null, score: number | null, winner: boolean) => (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-3", winner && "bg-ok-soft")}>
      <span className={cn("font-display text-[18px] font-bold uppercase", winner ? "text-ok" : "text-txt")}>
        {c?.name ?? "—"}
      </span>
      <span className="font-mono text-[20px] font-bold">{done ? score ?? 0 : "–"}</span>
    </div>
  )
  const winId = detail.winner?.id
  return (
    <>
      <section className={TM_CARD}>
        <div className={TM_CARD_HEAD}>
          <h3 className={TM_CARD_H3}>{done ? "Resultado" : "En juego"}</h3>
          {detail.proposalState === "disputed" && (
            <span className="inline-flex items-center gap-1.5 border border-solid border-bad px-2 py-1 font-mono text-[10px] font-bold uppercase text-bad">
              <Icon name="alert" size={12} />En disputa
            </span>
          )}
        </div>
        {line(detail.top, detail.g1, done && winId != null && winId === detail.top?.id)}
        <div className="border-t border-solid border-line" />
        {line(detail.bot, detail.g2, done && winId != null && winId === detail.bot?.id)}
      </section>
      {showChat && <LiveMatchChat detail={detail} onChanged={onChanged} />}
    </>
  )
}
