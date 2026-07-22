import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/boffmedia/primitives"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { CTA_ROW, PRI_GLOW } from "../landing-shared"
import { TV3_FEATS } from "../landing-data"

export function TvSmartRotom() {
  const t = useTranslations("boffmedia.landing.smartrotom")
  const featKeys = ["featMultiplatform", "featPokedex", "featEconomy", "featMessaging"] as const
  return (
    <TvCP
      id="tv-cp2"
      n="02"
      side="r"
      kick={<Decode text={t("kick")} />}
      title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      lead={t("lead")}
    >
      <div className="relative grid justify-items-start gap-[22px] max-[980px]:justify-items-center max-[980px]:text-center">
        <video
          data-tilt-fx
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/img/smartrotom.png"
          aria-label={t("demoAriaLabel")}
          className="relative z-[2] aspect-square w-full max-w-[540px] object-cover"
        >
          <source src="/assets/img/rotom_demo3.webm" type="video/webm" />
        </video>
        <div className="relative z-[2] flex flex-wrap gap-x-[18px] gap-y-2.5 max-[980px]:justify-center">
          {featKeys.map((fk) => (
            <span
              key={fk}
              className="inline-flex items-center gap-[9px] font-body text-[13.5px] font-medium leading-[1.3] text-txt max-[980px]:justify-center"
            >
              <i
                className="h-2 w-2 flex-none rotate-45 bg-[rgba(var(--zr),var(--zg),var(--zb),1)] shadow-[0_0_10px_rgba(var(--zr),var(--zg),var(--zb),0.6)] transition-[background] duration-[260ms] ease-linear"
                aria-hidden="true"
              />
              {t(fk)}
            </span>
          ))}
        </div>
      </div>
      <div className={CTA_ROW}>
        <Button variant="pri" iconRight="arrow" href="/herramientas" className={PRI_GLOW}>
          {t("ctaView")}
        </Button>
        <Button icon="bell">{t("ctaNotify")}</Button>
      </div>
    </TvCP>
  )
}
