"use client"

import { Toggle } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { defaultTierListDisplay, type TierListDisplayOptions } from "../display"

/** One controlled set of preferences for the live board and its image export. */
export function TierListDisplayControls({ value, onChange }: {
  value: TierListDisplayOptions; onChange: (value: TierListDisplayOptions) => void
}) {
  const t = useTranslations("tierLists.display")
  return <fieldset className="grid gap-3 border border-line bg-panel p-3">
    <legend className="px-1 font-mono text-xs uppercase text-txt-muted">{t("heading")}</legend>
    <p className="text-xs text-txt-dim">{t("hint")}</p>
    <div className="flex flex-wrap gap-x-6 gap-y-4">
      {(Object.keys(defaultTierListDisplay) as (keyof TierListDisplayOptions)[]).map((key) =>
        <Toggle key={key} label={t(key)} on={value[key]} onChange={(on) => onChange({ ...value, [key]: on })} />,
      )}
    </div>
  </fieldset>
}
