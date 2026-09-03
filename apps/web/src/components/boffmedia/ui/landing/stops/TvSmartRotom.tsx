import { ASSET, staticAsset } from '@/lib/assets';
import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@boffmedia/ui"
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
      title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      lead={t("lead")}
    >
      <div className="relative grid justify-items-start gap-[1.375rem] max-[980px]:justify-items-center max-[980px]:text-center">
        <video
          data-tilt-fx
          autoPlay
          muted
          loop
          playsInline
          poster={staticAsset(ASSET.boffmedia.img, 'smartrotom.png')}
          aria-label={t("demoAriaLabel")}
          className="relative z-[2] aspect-square w-full max-w-[33.75rem] object-cover"
        >
          <source src={staticAsset(ASSET.boffmedia.img, 'rotom_demo3.webm')} type="video/webm" />
        </video>
        <div className="relative z-[2] flex flex-wrap gap-x-[1.125rem] gap-y-2.5 max-[980px]:justify-center">
          {featKeys.map((fk) => (
            <span
              key={fk}
              className="inline-flex items-center gap-[0.5625rem] font-body text-[0.84375rem] font-medium leading-[1.3] text-txt max-[980px]:justify-center"
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
        {/* "Ver SmartRotom" goes to SmartRotom. It used to land on /herramientas,
            which is a different product entirely. */}
        <Button variant="pri" iconRight="arrow" href="/smartrotom" className={PRI_GLOW}>
          {t("ctaView")}
        </Button>
        <Button icon="bell">{t("ctaNotify")}</Button>
      </div>
    </TvCP>
  )
}
