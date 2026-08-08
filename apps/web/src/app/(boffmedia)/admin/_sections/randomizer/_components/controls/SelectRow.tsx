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
  /**
   * How to coerce the selected option value before writing it to the form.
   * FVX generation/int fields (e.g. updateMovesToGeneration) are numbers in the
   * schema; without coercion the <select> writes a string and zod rejects it.
   */
  valueType?: "string" | "number"
}

export function SelectRow({
  field,
  labelKey,
  tipKey,
  options,
  disabled,
  valueType = "string",
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
        const stringValue = value === null || value === undefined ? "" : String(value)
        const handleChange = (next: string) =>
          onChange(valueType === "number" ? Number(next) : next)
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
              onChange={handleChange}
              options={selectOptions}
              disabled={disabled}
            />
          </Field>
        )
      }}
    />
  )
}
