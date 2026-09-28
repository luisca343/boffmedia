"use client"

import { Disclosure, Toggle } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { defaultTierListDisplay, type TierListDisplayOptions } from "../display"

/** One controlled set of preferences for the live board and its image export. */
export function TierListDisplayControls({ value, onChange, collapsible = false }: {
  value: TierListDisplayOptions; onChange: (value: TierListDisplayOptions) => void; collapsible?: boolean
}) {
  const t = useTranslations("tierLists.display")
  const controls = <fieldset className={collapsible ? "grid gap-3 pt-3" : "grid gap-3 border border-line bg-panel p-3"}>
    <legend className={collapsible ? "sr-only" : "px-1 font-mono text-xs uppercase text-txt-muted"}>{t("heading")}</legend>
    <p className="text-xs text-txt-dim">{t("hint")}</p>
    <div className="flex flex-wrap gap-x-6 gap-y-4">
      {(Object.keys(defaultTierListDisplay) as (keyof TierListDisplayOptions)[]).map((key) =>
        <Toggle key={key} label={t(key)} on={value[key]} onChange={(on) => onChange({ ...value, [key]: on })} />,
      )}
    </div>
  </fieldset>
  return collapsible ? <Disclosure title={t("heading")} icon="settings">{controls}</Disclosure> : controls
}
