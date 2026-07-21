import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/boffmedia/primitives"
import { FxParticles } from "./travesia-fx"
import { BEAMS, Grain, PRI_GLOW } from "./landing-shared"
import { DISCORD } from "./landing-data"

export function TvMeta({ lvl, density }: { lvl: number; density: number }) {
  const t = useTranslations("boffmedia.landing.meta")
  return (
    <section className="relative z-[1] overflow-hidden pb-[150px] pt-32 text-center" id="tv-meta">
      {lvl >= 2 && (
        <FxParticles
          density={Math.round(density * 0.6)}
          className="[mask-image:linear-gradient(180deg,transparent,#000_300px)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_300px)]"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_300px)] [-webkit-mask-image:linear-gradient(180deg,transparent,#000_300px)]"
        aria-hidden="true"
      >
        {/* finish star: the single terminal where the spine ends */}
        <i className="absolute left-1/2 top-0 h-[22px] w-[22px] -translate-x-1/2 rounded-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_9px_rgba(var(--zr),var(--zg),var(--zb),0.12),0_0_0_18px_rgba(var(--zr),var(--zg),var(--zb),0.06),0_0_56px_16px_rgba(var(--zr),var(--zg),var(--zb),0.75)] before:absolute before:left-1/2 before:top-full before:h-[118px] before:w-[2px] before:-translate-x-1/2 before:content-[''] before:[background:linear-gradient(rgba(var(--zr),var(--zg),var(--zb),1),transparent)] after:absolute after:left-1/2 after:top-1/2 after:h-[46px] after:w-[46px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border after:border-solid after:border-[rgba(var(--zr),var(--zg),var(--zb),0.55)] after:content-[''] after:animate-[tv-ping_2.6s_ease-out_infinite] [.no-motion_&]:after:animate-none max-[820px]:left-[18px]" />
        <i className={cn(BEAMS, "left-[calc(50%_-_550px)] top-[calc(50%_-_640px)] h-[1100px] w-[1100px] opacity-70")} />
        <Grain />
      </div>
      <div className="wrap relative z-[2] px-5 min-[640px]:px-10">
        <span
          data-reveal
          className="inline-flex items-center gap-[9px] font-mono text-[11px] font-bold uppercase leading-none tracking-[0.16em] text-[rgba(var(--zr),var(--zg),var(--zb),1)] transition-colors duration-[260ms] ease-linear"
        >
          <i className="h-[7px] w-[7px] rounded-full bg-current shadow-[0_0_10px_currentColor]" aria-hidden="true" />
          {t("kicker")}
        </span>
        {/* display treatment from data-ds base styles; zone-tinted em stroke kept local */}
        <h2
          data-reveal
          style={{ ["--i"]: 1 } as React.CSSProperties}
          className="mb-4 mt-[22px] leading-[0.88] text-txt [font-size:clamp(58px,8vw,132px)]"
        >
          {t("titleStart")}{" "}
          <em className="italic text-transparent [-webkit-text-stroke:2px_rgba(var(--zr),var(--zg),var(--zb),1)] [text-shadow:0_0_44px_rgba(var(--zr),var(--zg),var(--zb),0.4)] [[data-theme=light]_&]:[text-shadow:0_0_28px_rgba(var(--zr),var(--zg),var(--zb),0.22)]">
            {t("titleEmphasis")}
          </em>
        </h2>
        <p
          data-reveal
          style={{ ["--i"]: 2 } as React.CSSProperties}
          className="mx-auto max-w-[52ch] font-body text-[17px] font-normal leading-[1.6] text-txt-muted"
        >
          {t("lead")}
        </p>
        <div data-reveal style={{ ["--i"]: 3 } as React.CSSProperties} className="mt-[34px] flex flex-wrap justify-center gap-3.5">
          <Button variant="pri" size="lg" iconRight="arrow" href="/entrar?mode=register" className={PRI_GLOW}>
            {t("ctaRegister")}
          </Button>
          <Button size="lg" href={DISCORD}>
            {t("ctaDiscord")}
          </Button>
        </div>
      </div>
    </section>
  )
}
