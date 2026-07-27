"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { KvPlatforms, KvReview, KvTags } from "./KvAtoms"
import { kvMetaBand, kvMetaColor, kvReviewBand, type KvInfoData, type KvKey, type KvPriceData } from "./keys-util"

const FACT_K = "font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim"

export function KvScores({ info }: { info: KvInfoData }) {
  const t = useTranslations("common.keys")
  const hasMeta = info.metacritic != null
  const cell = "flex min-w-0 flex-col justify-center gap-2.5 bg-panel px-[15px] py-[13px]"
  return (
    <div className={cn("grid gap-px border border-solid border-line bg-line", hasMeta ? "grid-cols-[minmax(190px,auto)_1fr]" : "grid-cols-1")}>
      {hasMeta && (
        <div className={cell}>
          <span className={FACT_K}>{t("metacritic")}</span>
          <div className="flex items-center gap-3">
            <span className="inline-grid h-[42px] min-w-[48px] flex-none place-items-center border-2 border-solid px-2 font-display text-[25px]/none font-extrabold italic tabular-nums" style={{ color: kvMetaColor(info.metacritic!), borderColor: kvMetaColor(info.metacritic!) }}>
              {info.metacritic}
            </span>
            <span className="font-mono text-[11px]/[1.35] text-txt-muted text-pretty">{t(`meta.${kvMetaBand(info.metacritic!)}`)}</span>
          </div>
        </div>
      )}
      <div className={cell}>
        <span className={FACT_K}>{t("steamRating")}</span>
        <KvReview score={info.review} count={info.reviewCount} />
        <span className="font-mono text-[11px]/[1.35] text-txt-muted text-pretty">{t(`review.${kvReviewBand(info.review)}`)}</span>
      </div>
    </div>
  )
}

export function KvInfo({ item }: { item: KvKey }) {
  const t = useTranslations("common.keys")
  const f = item.info
  const facts: { label: string; value: React.ReactNode }[] = [
    { label: t("developer"), value: f.developer },
    { label: t("publisher"), value: f.publisher },
    { label: t("release"), value: f.release },
    { label: t("platforms"), value: <KvPlatforms platforms={f.platforms} /> },
  ]
  return (
    <div className="grid gap-4">
      <p className="text-[14px]/[1.55] text-txt-muted text-pretty">{item.desc}</p>
      <div className="grid grid-cols-2 gap-px border border-solid border-line bg-line max-[600px]:grid-cols-1">
        {facts.map((r) => (
          <div key={r.label} className="flex flex-col gap-[5px] bg-panel px-[13px] py-[11px] transition-[background] duration-[140ms] hover:bg-panel-2">
            <span className={FACT_K}>{r.label}</span>
            <span className="font-display text-[13px]/[1.3] font-semibold not-italic text-txt">{r.value}</span>
          </div>
        ))}
      </div>
      <KvScores info={f} />
      {f.genres && f.genres.length > 0 && (
        <div className="grid gap-2">
          <span className={FACT_K}>{t("genres")}</span>
          <KvTags tags={f.genres} />
        </div>
      )}
    </div>
  )
}

export function KvPrice({ price }: { price: KvPriceData }) {
  const t = useTranslations("common.keys")
  if (price.isFree) {
    return (
      <div className="flex flex-col items-start gap-2.5 border border-solid border-line bg-panel-2 p-[22px]">
        <span className="font-display text-[44px]/[0.9] font-extrabold italic text-ok">{t("free")}</span>
        <span className="font-mono text-[11px]/none uppercase tracking-[0.06em] text-txt-muted">{t("freeToPlay")}</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start gap-2.5 border border-solid border-line bg-panel-2 p-[22px]">
      {price.discount > 0 && (
        <div className="inline-flex items-center gap-3">
          <span className="border border-solid border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft px-[9px] py-1.5 font-display text-[16px]/none font-extrabold italic text-ok">-{price.discount}%</span>
          <span className="font-mono text-[15px]/none text-txt-dim line-through">{price.initial}</span>
        </div>
      )}
      <span className="font-display text-[44px]/[0.9] font-extrabold italic text-accent">{price.final}</span>
      <span className="font-mono text-[11px]/none uppercase tracking-[0.06em] text-txt-muted">{price.discount > 0 ? t("currentPrice") : t("regularPrice")} · {t("keyValueSuffix")}</span>
    </div>
  )
}

export function KvGallery({ images, name }: { images: string[]; name: string }) {
  const t = useTranslations("common.keys")
  const [i, setI] = React.useState(0)
  const [err, setErr] = React.useState<Record<number, boolean>>({})
  const shots = images || []
  const fb = (
    <div className="grid h-full w-full place-items-center text-line-2 [background:repeating-linear-gradient(-45deg,var(--bg-2)_0_8px,var(--panel-2)_8px_16px)]">
      <Icon name="gamepad" size={34} />
    </div>
  )
  return (
    <div className="grid gap-2.5">
      <div className="relative aspect-[16/9] overflow-hidden border border-solid border-line-2 bg-base-2">
        {!err[i] && shots[i] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shots[i]} alt={t("screenshotAlt", { game: name, n: i + 1 })} onError={() => setErr((e) => ({ ...e, [i]: true }))} className="block h-full w-full object-cover" />
        ) : (
          fb
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {shots.map((s, k) => (
          <button key={k} type="button" aria-label={t("mediaAria", { n: k + 1 })} onClick={() => setI(k)} className={cn("relative aspect-[16/9] cursor-pointer overflow-hidden border border-solid bg-base-2 p-0 transition-[border-color] duration-[140ms]", k === i ? "border-accent [box-shadow:inset_0_0_0_1px_var(--accent)]" : "border-line hover:border-line-2")}>
            {!err[k] && s ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s} alt="" onError={() => setErr((e) => ({ ...e, [k]: true }))} className="block h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-line-2 [background:repeating-linear-gradient(-45deg,var(--bg-2)_0_8px,var(--panel-2)_8px_16px)]">
                <Icon name="gamepad" size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
