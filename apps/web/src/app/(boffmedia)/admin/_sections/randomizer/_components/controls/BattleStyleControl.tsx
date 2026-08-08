"use client"

import { Controller, useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { RadioGroup, Select, Field, type RadioOption } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

/**
 * settingBattleStyle is a structured object { modification, style } — not a flat
 * enum. The three radios drive `.modification`; the style <select> is enabled
 * only when modification === "SINGLE_STYLE". Wired directly (the shared control
 * kit only binds top-level keyof RandomizerSettings fields).
 */
export function BattleStyleControl({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const modification = useWatch({
    control: form.control,
    name: "settingBattleStyle.modification",
  })

  const modOptions: RadioOption[] = [
    { value: "UNCHANGED", label: t("opt.battleStyleMod.UNCHANGED"), disabled },
    { value: "RANDOM", label: t("opt.battleStyleMod.RANDOM"), disabled },
    { value: "SINGLE_STYLE", label: t("opt.battleStyleMod.SINGLE_STYLE"), disabled },
  ]

  const styleOptions = [
    { value: "SINGLE_BATTLE", label: t("opt.battleStyleStyle.SINGLE_BATTLE") },
    { value: "DOUBLE_BATTLE", label: t("opt.battleStyleStyle.DOUBLE_BATTLE") },
    { value: "TRIPLE_BATTLE", label: t("opt.battleStyleStyle.TRIPLE_BATTLE") },
    { value: "ROTATION_BATTLE", label: t("opt.battleStyleStyle.ROTATION_BATTLE") },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">{t("panels.battleStyleMode")}</h4>
      </div>
      <Controller
        control={form.control}
        name="settingBattleStyle.modification"
        render={({ field: { value, onChange } }) => (
          <RadioGroup
            value={typeof value === "string" ? value : ""}
            onChange={onChange}
            options={modOptions}
          />
        )}
      />
      <Controller
        control={form.control}
        name="settingBattleStyle.style"
        render={({ field: { value, onChange } }) => (
          <Field
            label={
              <div className="flex items-center gap-2">
                <span>{t("opt.battleStyleStyle.label")}</span>
                <InfoTooltip tipKey="opt.battleStyleStyle.tip" />
              </div>
            }
          >
            <Select
              value={typeof value === "string" ? value : ""}
              onChange={onChange}
              options={styleOptions}
              disabled={disabled || modification !== "SINGLE_STYLE"}
            />
          </Field>
        )}
      />
    </div>
  )
}
