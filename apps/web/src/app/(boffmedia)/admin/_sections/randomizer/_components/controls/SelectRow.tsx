"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Select, Field } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface SelectRowOption {
  value: string
  labelKey: string
}

interface SelectRowProps {
  field: keyof RandomizerSettings
  labelKey: string
  tipKey?: string
  options: SelectRowOption[]
  disabled?: boolean
}

export function SelectRow({
  field,
  labelKey,
  tipKey,
  options,
  disabled,
}: SelectRowProps) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const selectOptions = options.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }))

  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => {
        const stringValue = typeof value === "string" ? value : ""
        return (
          <Field
            label={
              <div className="flex items-center gap-2">
                <span>{t(labelKey)}</span>
                <InfoTooltip tipKey={tipKey} />
              </div>
            }
          >
            <Select
              value={stringValue}
              onChange={onChange}
              options={selectOptions}
              disabled={disabled}
            />
          </Field>
        )
      }}
    />
  )
}
