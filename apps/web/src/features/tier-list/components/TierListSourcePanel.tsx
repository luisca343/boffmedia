"use client"

import type { ReactNode } from "react"
import { Button, SearchInput, Select } from "@boffmedia/ui"
import { useTranslations } from "next-intl"

/** Controlled collection controls and recovery states; the host supplies cards/drop area. */
export function TierListSourcePanel({ search, onSearch, filter, onFilter, shown, total, assigned, controls, children }: {
  search: string; onSearch: (value: string) => void
  filter: string; onFilter: (value: string) => void
  shown: number; total: number; assigned: number; controls?: ReactNode; children: ReactNode
}) {
  const t = useTranslations("tierLists")
  const complete = total > 0 && assigned === total && filter === "unassigned" && !search.trim()
  return <section className="min-w-0 border border-line bg-panel" aria-label={t("sourcePool")}>
    <div className="grid gap-3 border-b border-line p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">{t("sourcePool")}</h2>
        <p role="status" className="text-xs tabular-nums text-txt-muted">{t("collectionProgress", { assigned, total })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={onSearch} onSubmit={() => {}} placeholder={t("search")} className="min-w-0 basis-full sm:basis-auto sm:flex-1" />
        <Select className="min-w-0 flex-1 sm:max-w-48" ariaLabel={t("filter")} value={filter} onChange={onFilter} options={[
          { value: "all", label: t("all") }, { value: "assigned", label: t("assigned") }, { value: "unassigned", label: t("unassigned") },
        ]} />
        <span role="status" className="text-xs text-txt-muted">{t("sourceCount", { count: shown })}</span>
        {controls}
      </div>
    </div>
    {children}
    {!shown && <div className="grid justify-items-start gap-2 border-t border-line p-4">
      <p className="text-sm text-txt-muted">{t(!total ? "emptyPool" : complete ? "allAssigned" : "noResults")}</p>
      {!!total && <Button type="button" size="sm" onClick={() => { onSearch(""); onFilter("all") }}>{t("showAllItems")}</Button>}
    </div>}
    <p className="border-t border-line px-4 py-2 text-xs text-txt-dim">{t("poolDropHint")}</p>
  </section>
}
