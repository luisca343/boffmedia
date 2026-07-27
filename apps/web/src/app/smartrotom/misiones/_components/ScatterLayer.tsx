"use client"

import { useTranslations } from "next-intl"
import { Doodle, InkBlot, NewspaperClipping, PostIt } from "./ui"

/**
 * What else is pinned to a tavern board: notes, clippings, doodles, spilled ink.
 * Pure decoration — `aria-hidden`, `pointer-events-none`, and never carrying a
 * figure. It is the only place in the app with invented copy, and it is invented
 * on purpose: these are props on the cork, not data about the player.
 */
export function ScatterLayer() {
  const t = useTranslations("misiones.scatterLayer")
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden xl:block">
      <div className="absolute right-[30px] top-[18px] rotate-[5deg]">
        <div className="w-[150px] border border-ms-ink-1/40 bg-gradient-to-b from-[#f0e0a8] to-[#d8c080] px-3 py-2.5 text-center font-ms-display text-[#1a0e07] shadow-[4px_6px_10px_rgba(0,0,0,.4)]">
          <div className="mb-0.5 text-[9px] tracking-[.25em]">{t("wantedLabel")}</div>
          <div className="text-base font-bold leading-none">{t("wantedName")}</div>
          <div className="mx-auto my-2 grid h-[60px] w-[60px] place-items-center border border-black/50 bg-gradient-to-br from-[#aa2a2a] to-[#6b1410] text-3xl font-black text-[#f5d785]">
            R
          </div>
          <div className="text-[10px] italic">{t("wantedReward")}</div>
        </div>
      </div>

      <div className="absolute left-8 top-[90px]">
        <Doodle kind="arrow" tilt={-12} size={130} />
      </div>

      <div className="absolute left-2 top-[270px]">
        <InkBlot size={50} tilt={30} />
      </div>

      <div className="absolute right-5 top-[360px]">
        <PostIt color="#a4d4ff" tilt={6} size={150} footer={t("postItFooter")}>
          {t.rich("postIt", { b: (chunks) => <strong>{chunks}</strong> })}
        </PostIt>
      </div>

      <div className="absolute bottom-3 left-[30px]">
        <NewspaperClipping
          tilt={3.5}
          width={210}
          source={t("clippingSource")}
          headline={t("clippingHeadline")}
          body={t("clippingBody")}
        />
      </div>

      <div className="absolute bottom-8 right-[70px]">
        <Doodle kind="check" tilt={8} size={90} />
      </div>

      <div className="absolute bottom-4 left-[44%]">
        <Doodle kind="star" tilt={-20} size={80} />
      </div>
    </div>
  )
}
