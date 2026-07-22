import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { Decode } from "../travesia-fx"
import { TvCP } from "../TvCP"
import { GLARE } from "../landing-shared"
import { TV3_GAMES } from "../landing-data"

export function TvJuegos() {
  const t = useTranslations("boffmedia.landing.juegos")
  const gameKeys = ["wingull", "bingo", "zomboff"] as const
  return (
    <TvCP
      id="tv-cp4"
      n="04"
      side="r"
      kick={<Decode text={t("kick")} />}
      title={t.rich("title", { em: (chunks) => <em>{chunks}</em> })}
      lead={t("lead")}
    >
      <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
        {TV3_GAMES.map((g, i) => (
          <Link
            key={g.n}
            href="/juegos"
            data-glare
            className={cn(
              "group/game relative flex cursor-pointer flex-col overflow-hidden border border-solid border-line bg-panel transition-[border-color,transform,box-shadow] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--zr),var(--zg),var(--zb),0.6)] hover:shadow-[0_22px_44px_rgba(0,0,0,0.42)]",
              /* zone-colored energy sweep confirming arrival */
              "after:absolute after:left-0 after:top-0 after:z-[4] after:h-[3px] after:w-0 after:bg-[rgba(var(--zr),var(--zg),var(--zb),1)] after:shadow-[0_0_12px_rgba(var(--zr),var(--zg),var(--zb),0.6)] after:transition-[width] after:duration-[600ms] after:ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[''] hover:after:w-full",
              GLARE,
              i === 0 && "col-span-full",
            )}
          >
            <div className={cn("relative overflow-hidden bg-base-2", i === 0 ? "aspect-[16/7] max-[520px]:aspect-[16/9]" : "aspect-[4/3]")}>
              {g.img ? (
                <img
                  src={g.img}
                  alt={t(`${gameKeys[i]}.n`)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/game:scale-[1.06]"
                />
              ) : (
                <div className="relative grid h-full w-full min-h-[120px] place-items-center outline-1 outline-dashed outline-line-2 [outline-offset:-6px] [background:repeating-linear-gradient(-45deg,var(--stripe)_0_10px,transparent_10px_20px)]">
                  <span className="px-3.5 text-center font-mono text-[12px]/[1.5] font-medium text-txt-muted">{t(`${gameKeys[i]}.n`)}</span>
                </div>
              )}
              <span
                className="absolute inset-0 [background:linear-gradient(to_top,rgba(5,7,10,0.94)_2%,rgba(5,7,10,0.25)_46%,transparent_72%)]"
                aria-hidden="true"
              />
              <span
                className="absolute right-2.5 top-2 z-[2] font-display text-[24px] font-extrabold italic leading-[0.8] text-transparent [-webkit-text-stroke:1.4px_rgba(255,255,255,0.5)]"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="absolute bottom-[13px] left-[15px] right-[15px] z-[2]">
                <span className="mb-[9px] inline-block bg-[rgba(var(--zr),var(--zg),var(--zb),0.92)] px-[9px] py-[5px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.1em] text-white transition-[background] duration-[260ms] ease-linear">
                  {t(`${gameKeys[i]}.tag`)}
                </span>
                {/* base h4 gives display/uppercase/tracking; 800 italic is this card's own */}
                <h4 className="font-extrabold italic leading-[0.94] text-white [font-size:clamp(20px,2.3vw,30px)] [text-shadow:0_2px_22px_rgba(0,0,0,0.6)]">
                  {t(`${gameKeys[i]}.n`)}
                </h4>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
              <p className="font-body text-[13px] font-normal leading-[1.5] text-txt-muted">{t(`${gameKeys[i]}.d`)}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-[color,gap] duration-[140ms] group-hover/game:gap-2.5 group-hover/game:text-[rgba(var(--zr),var(--zg),var(--zb),1)]">
                {t("enterWorld")} <Icon name="arrow" size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </TvCP>
  )
}
