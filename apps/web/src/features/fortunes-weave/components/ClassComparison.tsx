"use client"

import { Button } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { WeaveClass } from "../class-model"
import { ClassCard } from "./ClassCard"

export function ClassComparison({ classes, onRemove, onClear }: {
  classes: readonly WeaveClass[]
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const t = useTranslations("otros.fortunesWeave.classes")
  if (!classes.length) return null
  return <section aria-label={t("comparisonTitle")} className="border border-solid border-accent/40 bg-base-2 p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-display text-xl">{t("comparisonTitle")}</h2><p className="text-xs text-txt-muted">{t("comparisonHint")}</p></div>
      <Button size="sm" variant="ghost" onClick={onClear}>{t("clearComparison")}</Button>
    </div>
    <div className="grid gap-x-3 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((entry) => <ClassCard key={entry.id} entry={entry} alignFacts comparisonSelected onCompare={onRemove} />)}
    </div>
  </section>
}
