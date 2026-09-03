import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@boffmedia/ui"
import { FxParticles } from "./travesia-fx"
import { BEAMS, Grain, PRI_GLOW } from "./landing-shared"
import { DISCORD } from "./landing-data"

export function TvMeta({ lvl, density }: { lvl: number; density: number }) {
  const t = useTranslations("boffmedia.landing.meta")
  return (
    <section className="relative z-[1] overflow-hidden pb-[9.375rem] pt-32 text-center" id="tv-meta">
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
        <i className="absolute left-1/2 top-0 h-[1.375rem] w-[1.375rem] -translate-x-1/2 rounded-full bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_0_9px_rgba(var(--zr),var(--zg),var(--zb),0.12),0_0_0_18px_rgba(var(--zr),var(--zg),var(--zb),0.06),0_0_56px_16px_rgba(var(--zr),var(--zg),var(--zb),0.75)] before:absolute before:left-1/2 before:top-full before:h-[7.375rem] before:w-[2px] before:-translate-x-1/2 before:content-[''] before:[background:linear-gradient(rgba(var(--zr),var(--zg),var(--zb),1),transparent)] after:absolute after:left-1/2 after:top-1/2 after:h-[2.875rem] after:w-[2.875rem] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border after:border-solid after:border-[rgba(var(--zr),var(--zg),var(--zb),0.55)] after:content-[''] after:animate-[tv-ping_2.6s_ease-out_infinite] [.no-motion_&]:after:animate-none max-[820px]:left-[1.125rem]" />
        <i className={cn(BEAMS, "left-[calc(50%_-_550px)] top-[calc(50%_-_640px)] h-[68.75rem] w-[68.75rem] opacity-70")} />
        <Grain />
      </div>
      <div className="wrap relative z-[2] px-5 min-[640px]:px-10">
        {/* display treatment from data-ds base styles; zone-tinted em stroke kept local.
            The kicker that sat above this headline is gone with the rest of them;
            mt-0 closes the gap it left under the finish star. */}
        <h2
          data-reveal
          className="mb-4 mt-0 leading-[0.88] text-txt [font-size:clamp(58px,8vw,132px)]"
        >
          {t("titleStart")}{" "}
          <em className="italic text-transparent [-webkit-text-stroke:2px_rgba(var(--zr),var(--zg),var(--zb),1)] [text-shadow:0_0_44px_rgba(var(--zr),var(--zg),var(--zb),0.4)] [[data-theme=light]_&]:[text-shadow:0_0_28px_rgba(var(--zr),var(--zg),var(--zb),0.22)]">
            {t("titleEmphasis")}
          </em>
        </h2>
        <p
          data-reveal
          style={{ ["--i"]: 1 } as React.CSSProperties}
          className="mx-auto max-w-[52ch] font-body text-[1.0625rem] font-normal leading-[1.6] text-txt-muted"
        >
          {t("lead")}
        </p>
        <div data-reveal style={{ ["--i"]: 2 } as React.CSSProperties} className="mt-[2.125rem] flex flex-wrap justify-center gap-3.5">
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
