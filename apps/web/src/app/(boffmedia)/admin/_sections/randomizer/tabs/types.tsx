"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function TypesTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const typeEffectivenessMod = useWatch({
    control: form.control,
    name: "typeEffectivenessMod",
  })

  return (
    <div className="space-y-5">
      {/* Type Effectiveness */}
      <AvPanel
        title={t("panels.typeEffectiveness")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="typeEffectivenessMod"
            titleKey="panels.typeEffectivenessMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.typeEffectivenessMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.typeEffectivenessMod.RANDOM" },
              { value: "RANDOM_BALANCED", i18nKey: "opt.typeEffectivenessMod.RANDOM_BALANCED" },
              { value: "KEEP_IDENTITIES", i18nKey: "opt.typeEffectivenessMod.KEEP_IDENTITIES" },
              { value: "INVERSE", i18nKey: "opt.typeEffectivenessMod.INVERSE" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="inverseTypesRandomImmunities"
              labelKey="opt.inverseTypesRandomImmunities.label"
              tipKey="opt.inverseTypesRandomImmunities.tip"
              disabled={typeEffectivenessMod === "UNCHANGED"}
            />
            <ToggleRow
              field="updateTypeEffectiveness"
              labelKey="opt.updateTypeEffectiveness.label"
              tipKey="opt.updateTypeEffectiveness.tip"
            />
          </AvPanel>
        </div>
      </AvPanel>
    </div>
  )
}
