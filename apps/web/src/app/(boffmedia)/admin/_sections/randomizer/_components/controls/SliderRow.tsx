"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Slider } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface SliderRowProps {
  field: keyof RandomizerSettings
  labelKey: string
  tipKey?: string
  min: number
  max: number
  unit?: string
  disabled?: boolean
}

export function SliderRow({
  field,
  labelKey,
  tipKey,
  min,
  max,
  unit,
  disabled,
}: SliderRowProps) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => {
        const numValue = typeof value === "number" ? value : min
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">{t(labelKey)}</label>
                <InfoTooltip tipKey={tipKey} />
              </div>
              <span className="text-sm font-mono text-txt-muted">
                {numValue}
                {unit && ` ${unit}`}
              </span>
            </div>
            <Slider
              value={numValue}
              onChange={onChange}
              min={min}
              max={max}
              step={1}
              disabled={disabled}
            />
          </div>
        )
      }}
    />
  )
}
