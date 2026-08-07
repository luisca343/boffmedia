"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { RadioGroup, type RadioOption } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface RadioPanelOption {
  value: string
  i18nKey: string
  tipKey?: string
}

interface RadioPanelProps {
  field: keyof RandomizerSettings
  titleKey: string
  options: RadioPanelOption[]
  disabled?: boolean
}

export function RadioPanel({
  field,
  titleKey,
  options,
  disabled,
}: RadioPanelProps) {
  const t = useTranslations("admin.randomizer")
  const form = useFormContext<RandomizerSettings>()

  const radioOptions: RadioOption[] = options.map((opt) => ({
    value: opt.value,
    label: (
      <div className="flex items-center gap-2">
        <span>{t(opt.i18nKey)}</span>
        {opt.tipKey && <InfoTooltip tipKey={opt.tipKey} />}
      </div>
    ),
    disabled,
  }))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">{t(titleKey)}</h4>
      </div>
      <Controller
        control={form.control}
        name={field}
        render={({ field: { value, onChange } }) => {
          const stringValue = typeof value === "string" ? value : ""
          return (
            <RadioGroup
              value={stringValue}
              onChange={onChange}
              options={radioOptions}
            />
          )
        }}
      />
    </div>
  )
}
