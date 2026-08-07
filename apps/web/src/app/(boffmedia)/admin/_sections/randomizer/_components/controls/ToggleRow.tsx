"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Toggle } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface ToggleRowProps {
  field: keyof RandomizerSettings
  labelKey: string
  tipKey?: string
  polarity?: "direct" | "inverted"
  disabled?: boolean
}

export function ToggleRow({
  field,
  labelKey,
  tipKey,
  polarity = "direct",
  disabled,
}: ToggleRowProps) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => {
        const boolValue = Boolean(value)
        return (
          <div className="flex items-center gap-3">
            <Toggle
              on={polarity === "inverted" ? !boolValue : boolValue}
              onChange={(newValue) => {
                const finalValue =
                  polarity === "inverted" ? !newValue : newValue
                onChange(finalValue)
              }}
              label={t(labelKey)}
            />
            <InfoTooltip tipKey={tipKey} />
          </div>
        )
      }}
    />
  )
}
