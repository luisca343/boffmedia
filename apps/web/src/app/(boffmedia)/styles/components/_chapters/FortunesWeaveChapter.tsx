"use client"

import { useState } from "react"
import { Button } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { WEAVE_CLASSES } from "@/features/fortunes-weave/class-model"
import { ClassCard } from "@/features/fortunes-weave/components/ClassCard"
import { ClassComparison } from "@/features/fortunes-weave/components/ClassComparison"
import { Sample, Section } from "../showcase-shared"

export function FortunesWeaveChapter() {
  const t = useTranslations("otros.fortunesWeave.classes")
  const [ids, setIds] = useState(["shido", "high-savant", "the-blade"])
  const comparisons = ids.map((id) => WEAVE_CLASSES.find((entry) => entry.id === id)!)
  return <>
    <Section id="weave-class-card" kicker="ClassCard / ClassRankBadges / ClassRequirements" title={t("showcaseCard")} lead={t("showcaseLead")}>
      <Sample title={t("showcaseCard")} code="<ClassCard entry />" col note={t("showcaseNote")}>
        <div className="max-w-lg"><ClassCard entry={WEAVE_CLASSES.find((entry) => entry.id === "dragoon")!} /></div>
      </Sample>
    </Section>
    <Section id="weave-class-compare" kicker="ClassComparison" title={t("showcaseCompare")} lead={t("comparisonHint")}>
      <Sample title={t("showcaseCompare")} code="<ClassComparison classes onRemove onClear />" col note={t("showcaseNote")}>
        <ClassComparison classes={comparisons} onRemove={(id) => setIds((previous) => previous.filter((entry) => entry !== id))} onClear={() => setIds([])} />
        <Button size="sm" onClick={() => setIds(["shido", "high-savant", "the-blade"])}>{t("resetExample")}</Button>
        <Button size="sm" href="/otros/fortunes-weave">{t("showcaseOpen")}</Button>
      </Sample>
    </Section>
  </>
}
