"use client"

import { useTranslations } from "next-intl"
import { MewNote, MewPanel, MewText } from "../../MewAtoms"
import { MewFlag } from "../MewRefs"
import { MewCol, MewDetail, MewFacts, MewHero, type ViewProps } from "./scaffold"

export function KeywordView({ rec }: ViewProps) {
  const t = useTranslations("mewgenics")
  const blocks = [
    { label: t("label.rule"), v: rec.tip },
    { label: t("label.stackPos"), v: rec.tipPos },
    { label: rec.nameNeg ? t("label.stackNegNamed", { name: rec.nameNeg }) : t("label.stackNeg"), v: rec.tipNeg },
    { label: t("label.stackNone"), v: rec.tipLess },
  ].filter((b) => b.v && !/^[A-Z_]+$/.test(b.v))
  return (
    <MewDetail>
      <MewHero cat="keywords" rec={rec} badges={<MewFlag icon="flame" tone="warn">{t("label.statusBadge")}</MewFlag>} />
      <MewCol single>
        {blocks.length ? (
          blocks.map((b, i) => (
            <MewPanel key={i} title={b.label} icon="flame"><MewText>{b.v}</MewText></MewPanel>
          ))
        ) : (
          <MewNote>{t("label.noStatusDesc")}</MewNote>
        )}
        <MewPanel title={t("panel.data")} icon="database"><MewFacts rows={[{ label: t("label.id"), value: rec.id, mono: true }]} /></MewPanel>
      </MewCol>
    </MewDetail>
  )
}
