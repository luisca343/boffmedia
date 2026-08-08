"use client"

import { Controller, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Toggle, Input, Field } from "@boffmedia/ui"
import { RandomizerSettings } from "@boffmedia/pack-schema"
import { InfoTooltip } from "./InfoTooltip"

interface GatedNumberRowProps {
  field: keyof RandomizerSettings
  labelKey: string
  tipKey?: string
  min: number
  max: number
  /** Value that represents the "off"/disabled state. FVX uses 0 for these. */
  offValue?: number
  /** Value written when the toggle is switched on. Defaults to `min`. */
  onValue?: number
  disabled?: boolean
}

/**
 * A single numeric field that FVX presents as a checkbox + spinner pair, but
 * which the schema stores as one int (no backing boolean). The checkbox is
 * derived: it is "on" whenever the value differs from `offValue`. Toggling it
 * on writes `onValue` (default `min`); toggling off writes `offValue` (0).
 * The spinner is enabled only while the checkbox is on.
 *
 * Used for: startersBSTMinimum/Maximum, eliteFourUniquePokemonNumber,
 * additionalBoss/Important/RegularTrainerPokemon.
 */
export function GatedNumberRow({
  field,
  labelKey,
  tipKey,
  min,
  max,
  offValue = 0,
  onValue,
  disabled,
}: GatedNumberRowProps) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field: { value, onChange } }) => {
        const numValue = typeof value === "number" ? value : offValue
        const enabled = numValue !== offValue
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Toggle
                on={enabled}
                onChange={(on) => onChange(on ? (onValue ?? min) : offValue)}
                label={t(labelKey)}
                {...(disabled ? { className: "opacity-40 pointer-events-none" } : {})}
              />
              <InfoTooltip tipKey={tipKey} />
            </div>
            {enabled && (
              <Field label="">
                <Input
                  type="number"
                  value={numValue}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10)
                    const clamped = Number.isNaN(parsed)
                      ? min
                      : Math.min(max, Math.max(min, parsed))
                    onChange(clamped)
                  }}
                  min={min}
                  max={max}
                  disabled={disabled}
                />
              </Field>
            )}
          </div>
        )
      }}
    />
  )
}
