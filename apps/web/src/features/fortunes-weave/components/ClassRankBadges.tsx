"use client"

import { useTranslations } from "next-intl"
import type { ClassRank } from "../class-model"

export function ClassRankBadges({ ranks }: { ranks: readonly ClassRank[] }) {
  const t = useTranslations("otros.fortunesWeave.classes")
  return <div className="flex flex-wrap gap-1.5">
    {ranks.map(({ type, rank }) => <span key={type} className="inline-flex items-center gap-2 border border-solid border-line bg-base-2 px-2 py-1 text-xs text-txt">
      {t(`training.${type}`)}{rank && <b className="font-mono text-accent">{rank}</b>}
    </span>)}
  </div>
}
