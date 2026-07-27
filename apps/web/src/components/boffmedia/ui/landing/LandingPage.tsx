"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/boffmedia/ui/layout/Marquee"
import { useReveal } from "@/components/boffmedia/hooks/use-reveal"
import { FxCursor, FxProgress, useSignalFX } from "./travesia-fx"
import { useJourney, useTvParallax } from "./landing-hooks"
import { TvMinimap } from "./TvMinimap"
import { TvHero } from "./TvHero"
import { TvMeta } from "./TvMeta"
import { TvTools } from "./stops/TvTools"
import { TvSmartRotom } from "./stops/TvSmartRotom"
import { TvTorneos } from "./stops/TvTorneos"
import { TvJuegos } from "./stops/TvJuegos"
import { TvComunidad } from "./stops/TvComunidad"

/* Inline styles are used only where TailwindCSS cannot express the value:
   dynamic CSS custom properties driven by JS (--zr/--zg/--zb zone color, --pulse,
   --l/--i stagger indexes, minimap rail height) and the SVG-noise data-URI
   background (its quotes/spaces break arbitrary-value syntax). Everything else is
   Tailwind. `tv-route`/`tv-cp`/`tv-node` and `near`/`past`/`in` are unstyled JS
   marker classes, consumed via group-[.near]/[&.near] variants. */

export function LandingPage() {
  const t = useTranslations("boffmedia.landing.marquee")
  const lvl = 3
  const density = 90
  const rootRef = React.useRef<HTMLElement>(null)
  const [stop, setStop] = React.useState(0)

  useReveal([])
  useSignalFX(rootRef, lvl)
  useTvParallax(rootRef)
  useJourney(rootRef, setStop)

  return (
    <main
      ref={rootRef}
      data-ds="boffmedia"
      data-footer-flush=""
      className="tv-landing [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:cursor-none [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:[&_:is(a,button,input)]:cursor-none [.no-motion_&]:cursor-auto [.no-motion_&_:is(a,button,input)]:cursor-auto"
      style={{ ["--zr"]: 255, ["--zg"]: 92, ["--zb"]: 10, ["--jp"]: "0%", ["--pulse"]: "0px" } as React.CSSProperties}
    >
      <FxProgress />
      {/* continuous sky: fixed lighting that mutates color with scroll */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <i className="absolute left-[-16vw] top-[-12vw] h-[74vw] w-[74vw] rounded-full blur-[120px] transition-[background] duration-[260ms] ease-linear will-change-[background] [background:radial-gradient(circle,rgba(var(--zr),var(--zg),var(--zb),0.17),transparent_66%)] [[data-theme=light]_&]:opacity-70" />
        <i className="absolute bottom-[-14vw] right-[-16vw] h-[64vw] w-[64vw] rounded-full blur-[120px] transition-[background] duration-[260ms] ease-linear will-change-[background] [background:radial-gradient(circle,rgba(var(--zr),var(--zg),var(--zb),0.12),transparent_66%)] [[data-theme=light]_&]:opacity-55" />
        <i className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--stripe)_1px,transparent_1px),linear-gradient(90deg,var(--stripe)_1px,transparent_1px)] [background-size:68px_68px] [mask-image:radial-gradient(120%_100%_at_50%_30%,#000_30%,transparent_80%)] [-webkit-mask-image:radial-gradient(120%_100%_at_50%_30%,#000_30%,transparent_80%)]" />
      </div>

      <TvMinimap active={stop} />

      {/* clip content horizontally so the fixed sky isn't clipped */}
      <div className="overflow-x-clip">
        <TvHero lvl={lvl} density={density} />

        <div className="relative z-[1]">
          <Marquee items={["BoffMedia", "Pixelmon Wingull 2", "SmartRotom", "BattleSim", t("tournaments"), t("giveaways"), t("community")]} speed={30} />
        </div>

        <section
          className={cn(
            "tv-route relative z-[1]",
            /* central spine, zone-tinted at both ends */
            "before:absolute before:bottom-0 before:left-1/2 before:top-0 before:z-[1] before:w-[2px] before:-translate-x-1/2 before:content-[''] before:[background:linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0.95),var(--line-2)_4%,var(--line-2)_97%,rgba(var(--zr),var(--zg),var(--zb),0.95))] max-[820px]:before:left-[18px]",
            /* route → meta light pool centred on the finish star */
            "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:z-0 after:h-[420px] after:w-[min(860px,96vw)] after:-translate-x-1/2 after:translate-y-1/2 after:content-[''] after:[background:radial-gradient(50%_50%_at_50%_50%,rgba(var(--zr),var(--zg),var(--zb),0.12),transparent_70%)] [[data-theme=light]_&]:after:opacity-60",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-[2] w-[2px] -translate-x-1/2 opacity-50 [background-size:2px_36px] [background:repeating-linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0)_0_14px,rgba(var(--zr),var(--zg),var(--zb),0.55)_14px_22px)] [mask-image:linear-gradient(180deg,transparent,#000_5%,#000_95%,transparent)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_5%,#000_95%,transparent)] animate-[tv-flow_1.5s_linear_infinite] [.no-motion_&]:animate-none max-[820px]:left-[18px]"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 z-[3] w-[2px] -translate-x-1/2 shadow-[0_0_16px_rgba(var(--zr),var(--zg),var(--zb),0.5)] [background:linear-gradient(180deg,rgba(var(--zr),var(--zg),var(--zb),0.15),rgba(var(--zr),var(--zg),var(--zb),1))] [height:var(--pulse)] max-[820px]:left-[18px]"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 z-[4] -translate-x-1/2 -translate-y-1/2 [top:var(--pulse)] before:absolute before:left-1/2 before:top-1/2 before:h-10 before:w-10 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border before:border-solid before:border-[rgba(var(--zr),var(--zg),var(--zb),0.5)] before:content-[''] before:animate-[tv-ping_2.4s_ease-out_infinite] [.no-motion_&]:before:animate-none max-[820px]:left-[18px]"
          >
            <i className="block h-3 w-3 rounded-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_5px_rgba(var(--zr),var(--zg),var(--zb),0.16),0_0_22px_4px_rgba(var(--zr),var(--zg),var(--zb),0.8)]" />
          </span>
          <div className="wrap relative z-[3] px-5 min-[640px]:px-10">
            <TvTools />
            <TvSmartRotom />
            <TvTorneos />
            <TvJuegos />
            <TvComunidad />
          </div>
        </section>

        <TvMeta lvl={lvl} density={density} />
      </div>

      {lvl >= 3 && <FxCursor scope="main" />}
    </main>
  )
}
