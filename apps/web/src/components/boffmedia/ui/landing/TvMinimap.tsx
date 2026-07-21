"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { TV3_STOPS } from "./landing-data"
import { tvGoTo } from "./landing-shared"

export function TvMinimap({ active }: { active: number }) {
  const tStops = useTranslations("boffmedia.landing.stops")
  const tMinimap = useTranslations("boffmedia.landing.minimap")
  return (
    <aside
      className="group/map fixed left-[22px] top-1/2 z-[560] flex -translate-y-1/2 flex-col gap-[2px] py-1.5 max-[1120px]:hidden"
      aria-label={tMinimap("ariaLabel")}
    >
      <span className="absolute bottom-3.5 left-1.5 top-3.5 w-[2px] overflow-hidden bg-line" aria-hidden="true">
        <i
          className="block w-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_8px_rgba(var(--zr),var(--zg),var(--zb),0.6)] [transition:height_260ms_cubic-bezier(0.16,1,0.3,1),background_260ms_linear]"
          style={{ height: `${(active / (TV3_STOPS.length - 1)) * 100}%` }}
        />
      </span>
      {TV3_STOPS.map((s, ix) => {
        const on = ix === active
        const done = ix < active
        return (
          <button
            key={s.id}
            className="group/stop relative flex cursor-pointer items-center gap-3 py-1.5 pr-1.5 text-left"
            onClick={() => tvGoTo(s.id)}
            aria-current={on ? "true" : undefined}
            title={tStops(s.tk)}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative z-[2] h-3.5 w-3.5 flex-none rounded-full border-2 border-solid bg-base transition-all duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover/stop:border-[rgba(var(--zr),var(--zg),var(--zb),1)]",
                on
                  ? "border-[rgba(var(--zr),var(--zg),var(--zb),1)] bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_4px_rgba(var(--zr),var(--zg),var(--zb),0.16),0_0_16px_rgba(var(--zr),var(--zg),var(--zb),0.7)]"
                  : done
                    ? "border-[rgba(var(--zr),var(--zg),var(--zb),0.7)] bg-[rgba(var(--zr),var(--zg),var(--zb),0.35)]"
                    : "border-line-2",
              )}
            />
            <span
              className={cn(
                "pointer-events-none flex -translate-x-1.5 items-baseline gap-[7px] whitespace-nowrap font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] opacity-0 transition-[opacity,transform,color] duration-[140ms] group-hover/map:translate-x-0 group-hover/map:opacity-100",
                on ? "translate-x-0 text-txt opacity-100" : "text-txt-dim",
              )}
            >
              <b className={on ? "text-txt" : "text-txt-muted"}>{s.n}</b>
              {tStops(s.tk)}
            </span>
          </button>
        )
      })}
    </aside>
  )
}
