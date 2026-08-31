"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MewNote, MewPanel, MewText } from "../../MewAtoms"
import { MewData } from "../../mew-store"
import { MewFlag, MewRefList } from "../MewRefs"
import { MewDetail, MewHero, MewSections, MewMoreTag, mewTruncate, type ViewProps } from "./scaffold"

export function KeywordView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const blocks = [
    { label: t("label.rule"), v: rec.tip },
    { label: t("label.stackPos"), v: rec.tipPos },
    { label: rec.nameNeg ? t("label.stackNegNamed", { name: rec.nameNeg }) : t("label.stackNeg"), v: rec.tipNeg },
    { label: t("label.stackNone"), v: rec.tipLess },
  ].filter((b) => b.v && !/^[A-Z_]+$/.test(b.v))

  const appliedByAll = React.useMemo(() => {
    return MewData.select.keywordAppliedBy(rec.id)
  }, [rec.id])
  const { list: appliedBy, more: appliedByMore } = mewTruncate(appliedByAll, 12)

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="keywords" rec={rec} badges={<MewFlag icon="flame" tone="warn">{t("label.statusBadge")}</MewFlag>} />
      <MewSections>
        {blocks.length ? (
          blocks.map((b, i) => (
            <MewPanel key={i} title={b.label} icon="flame"><MewText>{b.v}</MewText></MewPanel>
          ))
        ) : (
          <MewPanel>
            <MewNote>{t("label.noStatusDesc")}</MewNote>
          </MewPanel>
        )}
        {appliedBy.length > 0 && (
          <MewPanel title={t("panel.usedBy")} icon="bolt" span="full">
            <div className="flex flex-wrap gap-1.5">
              <MewRefList ids={appliedBy.map((a) => a.id)} cat="abilities" icon="bolt" onNav={onNav} />
              {appliedByMore > 0 && <MewMoreTag n={appliedByMore} />}
            </div>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}
