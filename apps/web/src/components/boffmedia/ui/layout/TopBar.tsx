import * as React from "react"
import { Clock } from "@/components/boffmedia/primitives/clock"
import { Ticker } from "@/components/boffmedia/primitives/ticker"

const TICKER_ITEMS = [
  "Torneo Pixelmon Wingull 2 — 14 Jun",
  "Minecraft Bingo · Edición rápida — 21 Jun",
  "Project ZomBOFF · Supervivencia — 28 Jun",
  "Ranking: <em>AxelCraft</em> lidera con 12 480 pts",
  "SmartRotom — próximamente",
]

export function TopBar() {
  return (
    <div className="relative z-[60] flex h-10 items-center gap-3 border-b-2 border-accent bg-base-deep px-5 font-mono text-[11px] font-medium leading-none tracking-[0.04em] text-[#8b93a1] min-[640px]:gap-5 min-[640px]:px-10">
      <span className="shrink-0 animate-[bm-pulse_2.4s_ease-in-out_infinite] bg-[var(--naranja)] px-2.5 py-[5px] font-bold tracking-[0.14em] text-accent-ink [clip-path:polygon(6px_0,100%_0,calc(100%_-_6px)_100%,0_100%)]">
        EN VIVO
      </span>
      <Ticker items={TICKER_ITEMS} />
      <Clock className="hidden text-[#c9cfd9] min-[520px]:block" />
    </div>
  )
}
