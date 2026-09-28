"use client"

import { Badge } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { TierListRow } from "../core/schema"
import type { TierListDisplayOptions } from "../display"

/** Consistent, centered row identity. Counts are optional secondary metadata. */
export function TierListRowHeader({ row, count, display }: {
  row: TierListRow; count: number; display: TierListDisplayOptions
}) {
  const t = useTranslations("tierLists")
  return <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 text-center sm:flex-col" data-tier-row-header>
    {display.rowLabels && row.icon && <img src={row.icon} alt="" className="h-6 w-6 object-contain" onError={(e) => { e.currentTarget.hidden = true }} />}
    {display.rowLabels && <h2 className="max-w-full break-normal font-body text-base font-semibold not-italic normal-case leading-snug tracking-normal">{row.label}</h2>}
    {display.counts && <span data-tier-row-count title={t("count", { count })}>
      <Badge className="whitespace-nowrap tabular-nums tracking-normal"><span aria-hidden="true">{count}</span><span className="sr-only">{t("count", { count })}</span></Badge>
    </span>}
    {display.descriptions && row.description && <p className="w-full break-words text-xs leading-snug">{row.description}</p>}
  </div>
}
