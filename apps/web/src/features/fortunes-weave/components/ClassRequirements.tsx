"use client"

import { useTranslations } from "next-intl"
import type { WeaveClass } from "../class-model"
import { ClassRankBadges } from "./ClassRankBadges"

export function ClassRequirements({ entry }: { entry: WeaveClass }) {
  const t = useTranslations("otros.fortunesWeave.classes")
  const routes = useTranslations("otros.fortunesWeave.routes")
  const requirements = entry.requirements
  return <div className="grid gap-2 text-sm">
    <ClassRankBadges ranks={requirements.ranks} />
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-txt-muted">
      {requirements.level !== null && <span>{t("levelValue", { value: requirements.level })}</span>}
      {requirements.renown !== null && <span>{t("renownValue", { value: requirements.renown })}</span>}
      {requirements.license && <span>{t(`licenses.${requirements.license}`)}</span>}
      {requirements.item && <span className="text-accent">{t(`items.${requirements.item}`)}</span>}
      {!requirements.documented && <span>{t("undocumented")}</span>}
    </div>
    {requirements.routeUnlocks.map((unlock) => <p key={unlock.textKey} className="border-l-2 border-solid border-accent/40 pl-2 text-xs leading-5 text-txt-muted">
      <b className="text-txt">{routes(unlock.route)}: </b>{t(`routeUnlocks.${unlock.textKey}`)}
    </p>)}
  </div>
}
