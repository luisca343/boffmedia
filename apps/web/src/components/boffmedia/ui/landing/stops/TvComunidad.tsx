"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives/button"
import { Chip } from "@/components/boffmedia/primitives/chip"
import { CountUp } from "@/components/boffmedia/primitives/count-up"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, GLARE, HUD_FRAME, PRI_GLOW } from "../landing-shared"
import { DISCORD, TV3_FEED } from "../landing-data"
import { useSiteActivity } from "@/hooks/community/useCommunity"

export function TvComunidad() {
  const { activity } = useSiteActivity(6)
  // Real activity feeds the ticker; falls back to the editorial placeholders
  // while loading or if there's no recorded activity yet.
  const feed = activity.length
    ? activity.slice(0, 4).map((a) =>
        a.type === "achievement"
          ? { k: "win", t: `${a.actor} desbloqueó ${a.name}`, ln: "border-l-ok", tp: "bg-ok" }
          : { k: "join", t: `${a.actor} se unió a ${a.name}`, ln: "border-l-signal", tp: "bg-signal" },
      )
    : TV3_FEED

  return (
    <TvCP
      id="tv-cp5"
      n="05"
      side="l"
      kick={<Decode text="Parada 05 · Más que un servidor" />}
      title="Una comunidad <em>viva</em>"
      lead="Equipos, clanes, sorteos y eventos especiales. 412 jugadores ya compiten esta temporada; solo falta tu nombre en el ranking."
    >
      <div
        data-glare
        className={cn(
          "relative overflow-hidden border border-solid border-line px-6 pb-6 pt-[22px] backdrop-blur-[6px] [background:rgba(10,12,16,0.5)] [clip-path:polygon(0_0,100%_0,100%_100%,16px_100%,0_calc(100%_-_16px))] [[data-theme=light]_&]:[background:rgba(255,255,255,0.55)]",
          GLARE,
          HUD_FRAME,
        )}
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-solid border-line pb-4">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.1em] text-ok">
            <i className="h-[7px] w-[7px] rounded-full bg-ok shadow-[0_0_8px_var(--ok)] animate-[lv4-blink_1.6s_infinite]" aria-hidden="true" />
            En línea ahora
          </span>
          <b className="font-display text-[30px] font-extrabold italic leading-none text-txt tabular-nums">
            <CountUp value="128" />
          </b>
        </div>
        <div className="my-[18px] flex" aria-hidden="true">
          {["AX", "NV", "K7", "ZN", "ML"].map((a) => (
            <i
              key={a}
              className="-ml-2.5 grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-solid border-panel bg-panel-2 font-mono text-[12px] font-bold not-italic leading-none text-txt-muted first:ml-0"
            >
              {a}
            </i>
          ))}
          <i className="-ml-2.5 grid h-[42px] w-[42px] place-items-center rounded-full border-2 border-solid border-panel bg-accent font-mono text-[12px] font-bold not-italic leading-none text-accent-ink">
            +123
          </i>
        </div>
        <div className="mb-[18px] grid gap-2" aria-hidden="true">
          {feed.map((f, i) => (
            <span
              key={i}
              className={cn(
                "flex items-center gap-2.5 border-l-2 border-solid bg-panel px-3 py-[9px] font-body text-[13px] font-medium leading-[1.3] text-txt",
                f.ln,
              )}
              style={{ ["--i"]: i } as React.CSSProperties}
            >
              <i className={cn("h-[7px] w-[7px] flex-none rounded-full animate-[lv4-blink_2s_infinite]", f.tp)} />
              {f.t}
            </span>
          ))}
        </div>
        <div className="mb-[18px] flex flex-wrap gap-2">
          <Chip>Foro 24/7</Chip>
          <Chip>Sorteos semanales</Chip>
          <Chip>Equipos y clanes</Chip>
        </div>
        <div className={CTA_ROW}>
          <Button variant="pri" iconRight="arrow" href="/comunidad" className={PRI_GLOW}>
            Unirme
          </Button>
          <Button href={DISCORD}>Discord</Button>
        </div>
      </div>
    </TvCP>
  )
}
