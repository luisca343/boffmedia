"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Kicker, Button, CountUp } from "@/components/boffmedia/primitives"
import { Decode, FxParticles } from "./travesia-fx"
import { BEAMS, Grain, LINE_INNER, LINE_MASK, PRI_GLOW, tvGoTo } from "./landing-shared"
import { TV3_HUD } from "./landing-data"
import { useTvMouseVar } from "./landing-hooks"
import { useSiteStats } from "@/hooks/community/useCommunity"

export function TvHero({ lvl, density }: { lvl: number; density: number }) {
  const t = useTranslations("boffmedia.landing.hero")
  const artRef = React.useRef<HTMLDivElement>(null)
  useTvMouseVar(artRef)
  const { stats } = useSiteStats()
  // Real site stats feed the HUD; falls back to the editorial placeholders
  // while loading or if the API is unavailable (keeps the hero visually stable).
  const hud = stats
    ? [
        { k: t("hudCommunityLabel"), big: String(stats.users), suf: "+", sub: t("hudCommunityRegistered"), live: false },
        {
          k: t("hudEventsLabel"),
          big: String(stats.activeEvents > 0 ? stats.activeEvents : stats.events),
          sub: stats.activeEvents > 0 ? t("hudEventsLive") : t("hudEventsTotal"),
          live: stats.activeEvents > 0,
        },
      ]
    : TV3_HUD
  return (
    <section className="relative z-[1] grid min-h-screen items-center overflow-hidden pb-24 pt-[118px]" id="tv-hero">
      {lvl >= 2 && <FxParticles density={density} />}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <i
          data-pglow
          className="absolute left-[-200px] top-[-160px] h-[760px] w-[760px] rounded-full blur-[110px] will-change-transform [background:radial-gradient(circle,rgba(255,92,10,0.16),transparent_66%)] [[data-theme=light]_&]:opacity-55"
        />
        <i
          data-pglow
          className="absolute right-[-150px] top-[90px] h-[620px] w-[620px] rounded-full blur-[110px] will-change-transform [background:radial-gradient(circle,rgba(255,138,34,0.14),transparent_68%)] [[data-theme=light]_&]:opacity-55"
        />
        <i className="absolute inset-0 opacity-50 [background-image:linear-gradient(var(--stripe)_1px,transparent_1px),linear-gradient(90deg,var(--stripe)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(110%_85%_at_50%_40%,#000_35%,transparent_75%)] [-webkit-mask-image:radial-gradient(110%_85%_at_50%_40%,#000_35%,transparent_75%)]" />
        <Grain />
      </div>
      <div className="wrap relative z-[2] grid grid-cols-[1.08fr_0.92fr] items-center gap-[50px] px-5 max-[980px]:grid-cols-1 max-[980px]:gap-[30px] min-[640px]:px-10">
        <div>
          <Kicker>
            <Decode text={t("kicker")} />
          </Kicker>
          {/* display treatment comes from the data-ds base styles (root of LandingPage) */}
          <h1
            data-reveal="lines"
            className="group mb-0 mt-4 leading-[0.95] text-txt !opacity-100 !transform-none [font-size:clamp(52px,6.4vw,104px)]"
          >
            <span className={LINE_MASK}>
              <span className={LINE_INNER} style={{ ["--l"]: 0 } as React.CSSProperties}>
                {t("titleLine1")}
              </span>
            </span>
            <span className={LINE_MASK}>
              <span className={LINE_INNER} style={{ ["--l"]: 1 } as React.CSSProperties}>
                <em className="italic text-accent [-webkit-text-stroke:1.6px_var(--accent)] [text-shadow:0_0_38px_rgba(255,92,10,0.45)]">
                  {t("titleEmphasis")}
                </em>{" "}
                {t("titleLine2suffix")}
              </span>
            </span>
          </h1>
          <p
            data-reveal
            style={{ ["--i"]: 1 } as React.CSSProperties}
            className="mb-0 mt-6 max-w-[500px] font-body text-[17px] font-normal leading-[1.65] text-txt-muted"
          >
            {t("lead")}
          </p>
          <div data-reveal style={{ ["--i"]: 2 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-3.5">
            <Button variant="pri" size="lg" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
              {t("ctaStart")}
            </Button>
            <Button size="lg" onClick={() => tvGoTo("tv-cp1")}>
              {t("ctaMap")}
            </Button>
          </div>
          <div data-reveal style={{ ["--i"]: 3 } as React.CSSProperties} className="mt-10 flex gap-3.5 max-[820px]:flex-wrap">
            {hud.map((h) => (
              <div
                key={h.k}
                className="relative min-w-[150px] border border-solid border-line px-4 pb-[13px] pt-3.5 backdrop-blur-[6px] [background:rgba(10,12,16,0.6)] cut-tag [--cut-tag:9px] before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:bg-accent before:content-[''] [[data-theme=light]_&]:[background:rgba(255,255,255,0.6)]"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
                  {h.live && <i className="h-1.5 w-1.5 rounded-full bg-ok animate-[lv4-blink_1.6s_infinite] motion-reduce:animate-none" aria-hidden="true" />}
                  {"tk" in h ? t(`${h.tk}Label`) : h.k}
                </span>
                <span className="mb-[3px] mt-2 block font-display text-[30px] font-extrabold leading-none text-txt tabular-nums">
                  <CountUp value={h.big} />
                  {h.suf && <b>{h.suf}</b>}
                </span>
                <span className="block font-body text-[12px] font-normal leading-[1.3] text-txt-muted">{"tk" in h ? t(`${h.tk}Sub`) : h.sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative grid min-h-[500px] place-items-center max-[980px]:order-first max-[980px]:min-h-[360px]"
          ref={artRef}
          data-reveal="scale"
          style={{ ["--i"]: 2 } as React.CSSProperties}
        >
          <div
            className="absolute z-0 h-[460px] w-[460px] rounded-full blur-[60px] [background:radial-gradient(circle,rgba(255,92,10,0.32),transparent_66%)]"
            aria-hidden="true"
          />
          <i className={cn(BEAMS, "left-[calc(50%_-_360px)] top-[calc(50%_-_360px)] h-[720px] w-[720px]")} aria-hidden="true" />
          <i
            className="absolute left-[calc(50%_-_270px)] top-[calc(50%_-_270px)] h-[540px] w-[540px] rounded-full border border-dashed border-line-2 opacity-70 animate-[lv4-spin_90s_linear_infinite] [.no-motion_&]:animate-none"
            aria-hidden="true"
          />
          <img className="relative z-[2] w-[min(100%,500px)] max-[980px]:w-[min(80%,360px)] [filter:drop-shadow(0_26px_44px_rgba(0,0,0,0.55))_drop-shadow(0_0_56px_rgba(255,92,10,0.30))] [[data-theme=light]_&]:[filter:drop-shadow(0_22px_38px_rgba(20,23,28,0.28))_drop-shadow(0_0_46px_rgba(240,78,0,0.22))] [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:will-change-transform [@media(pointer:fine)_and_(prefers-reduced-motion:no-preference)]:[transform:perspective(950px)_rotateY(calc(var(--mx,0)*9deg))_rotateX(calc(var(--my,0)*-7deg))] opacity-[0.67]" src="/assets/brand/boff-logo.webp" alt="" aria-hidden="true" />

          <div className="absolute left-[-6%] top-[12%] z-[3] inline-flex items-center gap-2 border border-solid border-line-2 border-l-[3px] border-l-accent px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#f2f4f8] [background:rgba(0,0,0,0.82)] cut-tag [--cut-tag:7px] animate-[tv-bob_5s_ease-in-out_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:[background:rgba(16,19,24,0.9)] max-[980px]:left-0">
            <i className="h-1.5 w-1.5 rounded-full bg-ok animate-[lv4-blink_1.6s_infinite] motion-reduce:animate-none" />
            {t("tagActive")}
          </div>
          <div className="absolute bottom-[16%] right-[-4%] z-[3] inline-flex items-center gap-2 border border-solid border-line-2 border-l-[3px] border-l-accent px-3 py-2 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-[#f2f4f8] [animation-delay:-2.5s] [background:rgba(0,0,0,0.82)] cut-tag [--cut-tag:7px] animate-[tv-bob_5s_ease-in-out_infinite] [.no-motion_&]:animate-none [[data-theme=light]_&]:[background:rgba(16,19,24,0.9)] max-[980px]:right-0">
            {t("tagStops")}
          </div>
        </div>
      </div>
      <button
        onClick={() => tvGoTo("tv-cp1")}
        aria-label={t("scrollAriaLabel")}
        className="absolute bottom-[-2px] left-1/2 z-[4] inline-flex -translate-x-1/2 cursor-pointer flex-col items-center gap-3.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-txt-muted transition-colors duration-[140ms] hover:text-txt max-[820px]:left-[18px] max-[820px]:translate-x-0 max-[820px]:items-start"
      >
        <span>{t("scrollCta")}</span>
        <i
          aria-hidden="true"
          className="relative block h-[120px] w-[3px] shadow-[0_0_18px_rgba(255,92,10,0.65)] [background:linear-gradient(rgba(255,92,10,0),var(--accent)_55%,var(--accent))] before:absolute before:bottom-[-3px] before:left-1/2 before:h-[30px] before:w-[30px] before:-translate-x-1/2 before:rounded-full before:blur-[2px] before:content-[''] before:[background:radial-gradient(circle,rgba(255,92,10,0.6),transparent_70%)] after:absolute after:left-[-1.5px] after:top-0 after:h-4 after:w-1.5 after:rounded-[3px] after:bg-white after:shadow-[0_0_14px_var(--accent)] after:content-[''] after:animate-[tv-drop_1.9s_ease-in-out_infinite] [.no-motion_&]:after:animate-none"
        />
      </button>
    </section>
  )
}
