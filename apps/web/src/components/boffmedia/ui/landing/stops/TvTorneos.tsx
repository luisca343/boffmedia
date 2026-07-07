import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives/button"
import { CountUp } from "@/components/boffmedia/primitives/count-up"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, GLARE, HUD_FRAME, PRI_GLOW, TvCountdown } from "../landing-shared"
import { TV3_EVENT } from "../landing-data"

export function TvTorneos() {
  return (
    <TvCP
      id="tv-cp3"
      n="03"
      side="l"
      kick={<Decode text="Parada 03 · Competición" />}
      title="Torneos cada <em>semana</em>"
      lead="Brackets en directo, ranking por temporada y una gran final regional con 96 plazas. La gloria se gana en el servidor."
    >
      <div
        data-glare
        className={cn(
          "relative overflow-hidden border border-solid border-line-2 bg-base-deep text-[#f2f4f8] cut-corner [--cut-lg:14px]",
          GLARE,
          HUD_FRAME,
        )}
      >
        <div className="flex items-center justify-between gap-3.5 border-b border-solid border-line px-[18px] py-3.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">
          <span className="inline-flex items-center gap-[7px] text-[#ff4d5e]">
            <i className="h-1.5 w-1.5 rounded-full bg-[#ff4d5e] animate-[lv4-blink_1.3s_infinite]" />
            Gran final · Bo3
          </span>
          <span>{TV3_EVENT.title}</span>
        </div>
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-[30px] max-[520px]:grid-cols-1 max-[520px]:gap-5">
          <div className="grid justify-items-center gap-1.5 text-center">
            <span className="grid h-[50px] w-[50px] place-items-center bg-accent font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(255,92,10,0.45)] cut-tag [--cut-tag:10px]">
              V
            </span>
            <b className="font-display text-[16px] font-bold uppercase leading-none">Equipo Volt</b>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">Semilla #1</small>
          </div>
          <div className="grid justify-items-center gap-1.5">
            <span className="font-display text-[44px] font-extrabold leading-none tabular-nums [text-shadow:0_0_26px_rgba(255,92,10,0.35)]">
              <b className="text-accent">
                <CountUp value="2" />
              </b>
              –<CountUp value="1" />
            </span>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#9aa3b2]">Mapa 4 · En juego</small>
          </div>
          <div className="grid justify-items-center gap-1.5 text-center">
            <span className="grid h-[50px] w-[50px] place-items-center bg-signal font-display text-[22px] font-extrabold not-italic leading-none text-accent-ink shadow-[0_0_22px_rgba(77,163,255,0.45)] cut-tag [--cut-tag:10px]">
              A
            </span>
            <b className="font-display text-[16px] font-bold uppercase leading-none">Equipo Aqua</b>
            <small className="font-mono text-[10px] font-medium uppercase leading-none tracking-[0.08em] text-[#5f6774]">Semilla #2</small>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3.5 border-t border-solid border-line px-5 py-4">
          <span className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#5f6774]">
            Próxima emisión · {TV3_EVENT.date}
          </span>
          <TvCountdown compact />
        </div>
      </div>
      <div className={CTA_ROW}>
        <Button variant="pri" iconRight="arrow" href="/eventos" className={PRI_GLOW}>
          Inscribirme
        </Button>
        <Button href="/clasificacion">Ver ranking</Button>
      </div>
    </TvCP>
  )
}
