"use client"

import { useTranslations } from "next-intl"
import { MewPanel, MewNote } from "../../MewAtoms"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, rows, type ViewProps } from "./scaffold"

export function StoryCatView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")

  return (
    <MewDetail id={rec.id}>
      <MewHero cat="story_cats" rec={rec} />
      <MewDesc>{rec.desc}</MewDesc>
      <MewSections>
        {!rec.desc && (
          <MewPanel>
            <MewNote>{t("pop.noDesc")}</MewNote>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}
