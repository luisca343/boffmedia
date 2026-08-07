"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Input, Field } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface NumberRowProps {
  field: keyof RandomizerSettings
  labelKey: string
  tipKey?: string
  min?: number
  max?: number
  disabled?: boolean
}

export function NumberRow({
  field,
  labelKey,
  tipKey,
  min,
  max,
  disabled,
}: NumberRowProps) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => {
        const numValue = typeof value === "number" ? value : 0
        return (
          <Field
            label={
              <div className="flex items-center gap-2">
                <span>{t(labelKey)}</span>
                <InfoTooltip tipKey={tipKey} />
              </div>
            }
          >
            <Input
              type="number"
              value={numValue}
              onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
              min={min}
              max={max}
              disabled={disabled}
            />
          </Field>
        )
      }}
    />
  )
}
