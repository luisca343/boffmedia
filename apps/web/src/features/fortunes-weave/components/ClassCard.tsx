"use client"

import { Button } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import type { WeaveClass } from "../class-model"
import { ClassRankBadges } from "./ClassRankBadges"
import { ClassRequirements } from "./ClassRequirements"

function ClassFact({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="mb-2 font-mono text-[0.625rem] uppercase tracking-widest text-txt-dim">{label}</dt><dd>{children}</dd></div>
}

export function ClassCard({ entry, selected, comparisonSelected, comparisonDisabled, onAssign, onCompare, characterName, alignFacts }: {
  entry: WeaveClass
  selected?: boolean
  comparisonSelected?: boolean
  comparisonDisabled?: boolean
  onAssign?: (classId: string) => void
  onCompare?: (classId: string) => void
  characterName?: string
  alignFacts?: boolean
}) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const name = t(`names.${entry.id}`)
  return <article aria-label={name} className={`min-w-0 border border-solid bg-panel p-4 ${alignFacts ? "row-span-6 grid [grid-template-rows:subgrid]" : "flex flex-col"} ${selected ? "border-accent" : "border-line"}`}>
    <header className="mb-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-accent">{t(`tiers.${entry.tier}`)}</span>
        {entry.unverified && <span className="border border-solid border-line px-1.5 py-0.5 text-txt-muted">{t("unverified")}</span>}
        {selected && <span className="text-accent">{t("planned")}</span>}
      </div>
      <h3 className="font-display text-xl font-bold text-txt">{name}</h3>
      <p className="mt-1 text-xs text-txt-muted">{entry.movement
        ? t("movementValue", { type: t(`movementTypes.${entry.movement.type}`), value: entry.movement.spaces ?? t("unknown") })
        : t("movementUnknown")}</p>
    </header>
    <dl className={`text-sm leading-5 ${alignFacts ? "contents" : "grid gap-4"}`}>
      <ClassFact label={t("weapons")}>{entry.weapons.length ? <ClassRankBadges ranks={entry.weapons} /> : <span className="text-txt-muted">{t("undocumented")}</span>}</ClassFact>
      <ClassFact label={t("requirements")}><ClassRequirements entry={entry} /></ClassFact>
      <ClassFact label={t("skills")}><p className="text-txt-muted">{entry.skills.length ? entry.skills.map((skill) => t(`skillNames.${skill}`)).join(" · ") : t("undocumented")}</p></ClassFact>
      <ClassFact label={t("masterSkill")}><p className="text-txt">{entry.masterSkill ? t(`skillNames.${entry.masterSkill}`) : t("undocumented")}</p></ClassFact>
    </dl>
    {(onAssign || onCompare) && <footer className="mt-auto flex flex-wrap gap-2 pt-5">
      {onAssign && <Button size="sm" variant={selected ? "pri" : "default"} onClick={() => onAssign(selected ? "" : entry.id)}
        aria-label={t(selected ? "clearCharacterClass" : "assignCharacterClass", { character: characterName ?? "", name })}>
        {t(selected ? "removePlan" : "planClass")}
      </Button>}
      {onCompare && <Button size="sm" variant="ghost" aria-pressed={!!comparisonSelected} disabled={comparisonDisabled && !comparisonSelected}
        aria-label={t(comparisonSelected ? "removeComparison" : "addComparison", { name })} onClick={() => onCompare(entry.id)}>
        {t(comparisonSelected ? "remove" : "compare")}
      </Button>}
    </footer>}
  </article>
}
