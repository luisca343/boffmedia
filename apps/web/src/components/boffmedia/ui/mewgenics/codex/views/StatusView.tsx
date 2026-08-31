"use client"

import { useTranslations } from "next-intl"
import { MewPanel, MewNote } from "../../MewAtoms"
import { mewStatModLabel } from "../../mew-util"
import { MewEffects, MewFlag } from "../MewRefs"
import { MewDesc, MewDetail, MewFacts, MewHero, MewSections, rows, type ViewProps } from "./scaffold"

const STATUS_KIND_ICON: Record<string, string> = {
  weather: "cloud",
  injuries: "heart",
  elite_buffs: "sparkles",
}

export function StatusView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const kind = typeof rec.status_kind === "string" ? rec.status_kind : ""
  const icon = (STATUS_KIND_ICON[kind] || "flame") as any
  const kindLabel = kind ? t(`filter.statuses.${kind}`) : "—"

  const effects = typeof rec.effects === "object" && rec.effects !== null ? (rec.effects as Record<string, unknown>) : null
  const passives = typeof rec.passives === "object" && rec.passives !== null ? (rec.passives as Record<string, unknown>) : null
  const statModRows = rec.statMods
    ? Object.entries(rec.statMods as Record<string, unknown>).map(([k, v]) => ({ label: mewStatModLabel(t, k), value: (typeof v === "number" && v > 0 ? "+" : "") + v }))
    : []
  const hasDesc = typeof rec.desc === "string" && rec.desc.length > 0
  const hasBody = hasDesc || !!(effects && Object.keys(effects).length) || !!(passives && Object.keys(passives).length) || statModRows.length > 0

  return (
    <MewDetail id={rec.id}>
      <MewHero
        cat="statuses"
        rec={rec}
        badges={
          <>
            {kind ? <MewFlag icon={icon}>{kindLabel}</MewFlag> : null}
            {rec.elite_type === "boss" && <MewFlag icon="star" tone="warn">{t("label.bossLabel")}</MewFlag>}
            {rec.unique === true && <MewFlag icon="sparkles" tone="good">{t("label.unique")}</MewFlag>}
          </>
        }
      />
      {hasDesc && <MewDesc>{rec.desc}</MewDesc>}
      <MewSections>
        {effects && Object.keys(effects).length > 0 && (
          <MewPanel title={t("panel.effects")} icon="flame">
            <MewEffects map={effects} onNav={onNav} />
          </MewPanel>
        )}
        {passives && Object.keys(passives).length > 0 && (
          <MewPanel title={t("panel.effects")} icon="sparkles" count={Object.keys(passives).length}>
            <MewEffects map={passives} onNav={onNav} />
          </MewPanel>
        )}
        {statModRows.length > 0 && (
          <MewPanel title={t("panel.statMods")} icon="sliders">
            <MewFacts rows={statModRows} />
          </MewPanel>
        )}
        {typeof rec.value === "number" && (
          <MewPanel title={t("panel.data")} icon="chart">
            <MewFacts rows={rows([{ label: t("label.eliteValue"), value: rec.value }])} />
          </MewPanel>
        )}
        {!hasBody && (
          <MewPanel>
            <MewNote>{t("label.noData")}</MewNote>
          </MewPanel>
        )}
      </MewSections>
    </MewDetail>
  )
}
