import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Button } from "@/components/boffmedia/primitives/button"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_MONO, CTA_ROW, GLARE, PRI_GLOW } from "../landing-shared"
import { TV3_TOOLS, TV3_TOOL_COUNT } from "../landing-data"

export function TvTools() {
  return (
    <TvCP
      id="tv-cp1"
      n="01"
      side="l"
      kick={<Decode text="Parada 01 · Tu equipo" />}
      title="Caja de <em>herramientas</em>"
      lead="Calculadoras, simuladores y trackers hechos por y para la comunidad. Afina antes de cada combate."
    >
      <div className="overflow-hidden border border-solid border-line backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] cut-tag [--cut-tag:12px] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]">
        <div className="flex items-center gap-2.5 border-b border-solid border-line bg-base-deep px-3.5 py-[11px]" aria-hidden="true">
          <span className="flex gap-[5px]">
            <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
            <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
            <i className="h-[9px] w-[9px] rounded-full bg-line-2" />
          </span>
          <b className="font-mono text-[12px] font-semibold leading-none tracking-[0.05em] text-[#9aa3b2]">toolkit.boff</b>
          <span className="ml-auto inline-flex items-center gap-[7px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-colors duration-[260ms] ease-linear">
            <i className="h-1.5 w-1.5 rounded-full bg-current animate-[lv4-blink_1.6s_infinite]" />{TV3_TOOLS.length} módulos activos
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-px bg-line max-[520px]:grid-cols-1">
          {TV3_TOOLS.map((t) => (
            <Link
              href={t.href}
              key={t.ix}
              data-glare
              data-tilt-fx
              className={cn(
                "group/mod relative flex items-start gap-3.5 overflow-hidden bg-panel px-4 pb-[18px] pt-4 no-underline transition-[background] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:bg-panel-2",
                GLARE,
              )}
            >
              <span className="grid h-[42px] w-[42px] flex-none place-items-center border border-solid border-line-2 bg-[rgba(var(--zr),var(--zg),var(--zb),0.08)] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-[background,box-shadow] duration-[260ms] cut-tag group-hover/mod:bg-[rgba(var(--zr),var(--zg),var(--zb),0.16)] group-hover/mod:shadow-[0_0_20px_rgba(var(--zr),var(--zg),var(--zb),0.3)]">
                <Icon name={t.ic} size={20} />
              </span>
              <span className="flex min-w-0 flex-col gap-[5px]">
                <span className="flex items-baseline gap-2">
                  <i className="font-mono text-[11px] font-bold not-italic leading-none text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                    {t.ix}
                  </i>
                  <b className="font-display text-[16px] font-bold uppercase leading-none tracking-[0.01em] text-txt">{t.n}</b>
                </span>
                <small className="font-body text-[12px] font-normal leading-[1.4] text-txt-muted">{t.d}</small>
              </span>
              <span className="absolute right-3.5 top-4 -translate-x-1 text-txt-muted opacity-0 transition-[opacity,transform,color] duration-[140ms] group-hover/mod:translate-x-0 group-hover/mod:opacity-100 group-hover/mod:text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                <Icon name="arrow" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className={CTA_ROW}>
        <Button variant="pri" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
          Abrir la caja
        </Button>
        <span className={CTA_MONO}>{TV3_TOOL_COUNT} utilidades activas</span>
      </div>
    </TvCP>
  )
}
