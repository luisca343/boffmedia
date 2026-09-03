"use client"

import { type ReactNode } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Toggle, RadioGroup, Select, Slider, Input, Icon, Tooltip, type RadioOption } from "@boffmedia/ui"
import type { RandomizerSettings } from "@boffmedia/pack-schema"
import { cn } from "@/lib/utils"
import {
  type RzControl,
  type RzGate,
  MISC_BITS,
  gatePasses,
  firstFailingGate,
  gateParentField,
  gateFields,
  FIELD_INDEX,
} from "./catalog"
import { useRandomizerUi } from "./RandomizerUiContext"

/* -------------------------------------------------------------------------- */
/* Small shared pieces                                                        */
/* -------------------------------------------------------------------------- */

function InfoTip({ tipKey }: { tipKey?: string }) {
  const t = useTranslations("randomizer")
  if (!tipKey) return null
  return (
    <Tooltip label={t(tipKey)} side="right" className="max-w-xs">
      <Icon name="info" size={14} className="text-txt-dim hover:text-accent-bright cursor-help transition-colors" />
    </Tooltip>
  )
}

const WARN_STYLES: Record<string, string> = {
  info: "border-l-signal bg-signal-soft text-signal",
  warn: "border-l-warn bg-warn-soft text-warn",
  bad: "border-l-bad bg-bad-soft text-bad",
}

/**
 * The redesigned control row — the single most important visual: a 2px orange
 * left-bar + soft tint whenever the value differs from its default, an inline
 * gating reason when disabled (never silent), and any validation warning.
 */
function RowShell({
  field,
  disabled,
  reason,
  inline,
  label,
  tipKey,
  control,
  body,
}: {
  field: string
  disabled?: boolean
  reason?: string | null
  inline?: boolean
  label: ReactNode
  tipKey?: string
  /** the input widget shown to the right (inline) — toggles, gated switch */
  control?: ReactNode
  /** the input widget shown below the label — radios, selects, sliders */
  body?: ReactNode
}) {
  const ui = useRandomizerUi()
  const changed = ui.isChanged(field)
  const warning = ui.warningFor(field)
  const flashing = ui.flashField === field
  const compact = ui.density === "compact"

  return (
    <div
      data-field={field}
      className={cn(
        "border-b border-solid border-line last:border-b-0 border-l-2 border-l-transparent",
        "transition-[background,border-color] duration-200",
        compact ? "py-[0.5625rem] px-[0.875rem]" : "py-[0.8125rem] px-4",
        changed && "border-l-accent bg-accent-soft/[0.45]",
        disabled && "opacity-50",
        flashing && "!bg-accent-soft !border-l-accent",
      )}
    >
      <div className={cn("flex items-center gap-2.5", inline && "justify-between")}>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-body text-[0.875rem] font-semibold text-txt">{label}</span>
          <InfoTip tipKey={tipKey} />
        </div>
        {inline && control}
      </div>
      {!inline && body && <div className="mt-2.5">{body}</div>}
      {disabled && reason && (
        <p className="flex items-center gap-1.5 mt-2 font-mono text-[0.65625rem] tracking-[0.03em] text-warn">
          <Icon name="lock" size={12} className="shrink-0" />
          <span>{reason}</span>
        </p>
      )}
      {warning && (
        <p
          className={cn(
            "flex items-start gap-1.5 mt-[0.5625rem] py-[0.4375rem] px-[0.5625rem] border-l-2 border-solid text-[0.71875rem] leading-[1.4]",
            WARN_STYLES[warning.level],
          )}
        >
          <Icon name={warning.level === "info" ? "info" : "alert"} size={13} className="shrink-0 mt-px" />
          <span>{warning.text}</span>
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Gate evaluation for a single control                                       */
/* -------------------------------------------------------------------------- */

/** Watch just the fields a control's gate/show conditions depend on. */
function useGateState(control: RzControl) {
  const form = useFormContext<RandomizerSettings>()
  const names = Array.from(new Set([...gateFields(control.gate), ...gateFields(control.show)]))
  // When a control has no gate/show, watch a stable no-op field (`romName` is
  // never edited in the UI) so `useWatch` never receives an empty array — some
  // react-hook-form versions treat `name: []` as "watch everything".
  const watchNames = names.length ? names : ["romName"]
  const watched = useWatch({
    control: form.control,
    name: watchNames as never,
  }) as unknown[]
  const values: Record<string, unknown> = {}
  names.forEach((n, i) => (values[n] = watched[i]))
  return values
}

function computeReason(
  control: RzControl,
  values: Record<string, unknown>,
  t: (key: string, values?: Record<string, string | number>) => string,
): string | null {
  if (!control.gate) return null
  const failing = firstFailingGate(control.gate, values)
  if (!failing) return null
  const parent = gateParentField(failing)
  const parentLabelKey = parent ? FIELD_INDEX[parent]?.control.labelKey : undefined
  const setting = parentLabelKey ? t(parentLabelKey) : (parent ?? "")
  return t("chrome.reasonRequires", { setting })
}

/* -------------------------------------------------------------------------- */
/* Per-kind renderers                                                         */
/* -------------------------------------------------------------------------- */

export function ControlRenderer({ control }: { control: RzControl }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const values = useGateState(control)

  const show = !control.show || gatePasses(control.show, values)
  if (!show) return null

  const disabled = !!control.gate && !gatePasses(control.gate, values)
  const reason = computeReason(control, values, t)
  const label = t(control.labelKey)

  switch (control.kind) {
    case "toggle":
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => (
            <RowShell
              field={control.field}
              disabled={disabled}
              reason={reason}
              inline
              label={label}
              tipKey={control.tipKey}
              control={
                <Toggle
                  on={Boolean(value)}
                  onChange={(v) => !disabled && onChange(v)}
                  ariaLabel={label}
                  className={disabled ? "pointer-events-none" : ""}
                />
              }
            />
          )}
        />
      )

    case "radio": {
      const opts: RadioOption[] = (control.options ?? []).map((o) => ({
        value: o.value,
        label: t(o.labelKey),
        disabled,
      }))
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => (
            <RowShell
              field={control.field}
              disabled={disabled}
              reason={reason}
              label={label}
              tipKey={control.tipKey}
              body={<RadioGroup value={typeof value === "string" ? value : ""} onChange={onChange} options={opts} />}
            />
          )}
        />
      )
    }

    case "select": {
      const valueType = control.field === "updateBaseStatsToGeneration" || control.field === "updateMovesToGeneration" ? "number" : "string"
      const opts = (control.options ?? []).map((o) => ({ value: o.value, label: t(o.labelKey) }))
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => (
            <RowShell
              field={control.field}
              disabled={disabled}
              reason={reason}
              label={label}
              tipKey={control.tipKey}
              body={
                <Select
                  value={value === null || value === undefined ? "" : String(value)}
                  onChange={(v) => onChange(valueType === "number" ? Number(v) : v)}
                  options={opts}
                  disabled={disabled}
                />
              }
            />
          )}
        />
      )
    }

    case "singleType": {
      const RANDOM = "__RANDOM__"
      const opts = [
        { value: RANDOM, label: t("opt.startersSingleType.RANDOM") },
        ...(control.options ?? []).map((o) => ({ value: o.value, label: t(o.labelKey) })),
      ]
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => (
            <RowShell
              field={control.field}
              disabled={disabled}
              reason={reason}
              label={label}
              tipKey={control.tipKey}
              body={
                <Select
                  value={value == null ? RANDOM : String(value)}
                  onChange={(v) => onChange(v === RANDOM ? null : v)}
                  options={opts}
                  disabled={disabled}
                />
              }
            />
          )}
        />
      )
    }

    case "slider":
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => (
            <RowShell
              field={control.field}
              disabled={disabled}
              reason={reason}
              label={label}
              tipKey={control.tipKey}
              body={
                <Slider
                  value={typeof value === "number" ? value : (control.min ?? 0)}
                  onChange={onChange}
                  min={control.min}
                  max={control.max}
                  step={1}
                  unit={control.unit ?? ""}
                  disabled={disabled}
                />
              }
            />
          )}
        />
      )

    case "gated":
      return (
        <Controller
          control={form.control}
          name={control.field as never}
          render={({ field: { value, onChange } }) => {
            const num = typeof value === "number" ? value : 0
            const on = num !== 0
            return (
              <RowShell
                field={control.field}
                disabled={disabled}
                reason={reason}
                inline
                label={label}
                tipKey={control.tipKey}
                control={
                  <div className="flex items-center gap-3">
                    {on && (
                      <Input
                        type="number"
                        className="w-[5.75rem] font-mono"
                        value={num}
                        min={control.min}
                        max={control.max}
                        disabled={disabled}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10)
                          const clamped = Number.isNaN(parsed)
                            ? (control.min ?? 0)
                            : Math.min(control.max ?? parsed, Math.max(control.min ?? parsed, parsed))
                          onChange(clamped)
                        }}
                      />
                    )}
                    <Toggle
                      on={on}
                      onChange={(v) => !disabled && onChange(v ? (control.onValue ?? control.min ?? 1) : 0)}
                      ariaLabel={label}
                      className={disabled ? "pointer-events-none" : ""}
                    />
                  </div>
                }
              />
            )
          }}
        />
      )

    case "customStarter":
      return <CustomStarters control={control} disabled={disabled} reason={reason} />

    case "battleStyle":
      return <BattleStyle control={control} />

    case "miscBitmask":
      return <MiscBitmask />

    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/* Special controls                                                           */
/* -------------------------------------------------------------------------- */

function CustomStarters({ control, disabled, reason }: { control: RzControl; disabled?: boolean; reason?: string | null }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  return (
    <RowShell
      field="customStarters"
      disabled={disabled}
      reason={reason}
      label={t("panels.starterMode")}
      body={
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Controller
              key={i}
              control={form.control}
              name={`customStarters.${i}` as "customStarters.0"}
              render={({ field: { value, onChange } }) => (
                <label className="grid gap-1.5">
                  <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                    {t(`opt.customStarter.label${i + 1}`)}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={typeof value === "number" ? value : 0}
                    onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </label>
              )}
            />
          ))}
        </div>
      }
    />
  )
}

function BattleStyle({ control }: { control: RzControl }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const modification = useWatch({ control: form.control, name: "settingBattleStyle.modification" })

  const modOptions: RadioOption[] = [
    { value: "UNCHANGED", label: t("opt.battleStyleMod.UNCHANGED") },
    { value: "RANDOM", label: t("opt.battleStyleMod.RANDOM") },
    { value: "SINGLE_STYLE", label: t("opt.battleStyleMod.SINGLE_STYLE") },
  ]
  const styleOptions = ["SINGLE_BATTLE", "DOUBLE_BATTLE", "TRIPLE_BATTLE", "ROTATION_BATTLE"].map((v) => ({
    value: v,
    label: t(`opt.battleStyleStyle.${v}`),
  }))

  return (
    <RowShell
      field="settingBattleStyle"
      label={t(control.labelKey)}
      body={
        <div className="grid gap-4">
          <Controller
            control={form.control}
            name="settingBattleStyle.modification"
            render={({ field: { value, onChange } }) => (
              <RadioGroup value={typeof value === "string" ? value : ""} onChange={onChange} options={modOptions} />
            )}
          />
          <Controller
            control={form.control}
            name="settingBattleStyle.style"
            render={({ field: { value, onChange } }) => (
              <label className="grid gap-1.5">
                <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-txt-dim">
                  {t("opt.battleStyleStyle.label")}
                </span>
                <Select
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                  options={styleOptions}
                  disabled={modification !== "SINGLE_STYLE"}
                />
              </label>
            )}
          />
        </div>
      }
    />
  )
}

function MiscBitmask() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const ui = useRandomizerUi()
  const compact = ui.density === "compact"
  const tweaks = (useWatch({ control: form.control, name: "currentMiscTweaks" }) as number) ?? 0

  const setBit = (mask: number, on: boolean) => {
    const next = on ? tweaks | mask : tweaks & ~mask
    form.setValue("currentMiscTweaks", next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      {MISC_BITS.map(({ mask, key }) => {
        const on = (tweaks & mask) !== 0
        return (
          <div
            key={key}
            className={cn(
              "flex items-center justify-between gap-2.5 border-b border-solid border-line border-l-2 border-l-transparent",
              compact ? "py-[0.5625rem] px-[0.875rem]" : "py-[0.8125rem] px-4",
              on && "border-l-accent bg-accent-soft/[0.45]",
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-body text-[0.875rem] font-semibold text-txt">{t(`opt.${key}.label`)}</span>
              <InfoTip tipKey={`opt.${key}.tip`} />
            </div>
            <Toggle on={on} onChange={(v) => setBit(mask, v)} ariaLabel={t(`opt.${key}.label`)} />
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Human-readable value for the summary drawer                                */
/* -------------------------------------------------------------------------- */

export function humanValue(
  control: RzControl,
  value: unknown,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  switch (control.kind) {
    case "toggle":
      return value ? t("chrome.on") : t("chrome.off")
    case "slider":
      return `${value ?? ""}${control.unit ?? ""}`
    case "gated":
      return value === 0 || value == null ? t("chrome.off") : String(value)
    case "radio":
    case "select": {
      const opt = (control.options ?? []).find((o) => o.value === String(value))
      return opt ? t(opt.labelKey) : String(value)
    }
    case "singleType":
      return value == null ? t("opt.startersSingleType.RANDOM") : t(`opt.pokemonTypes.${value}`)
    case "battleStyle": {
      const v = value as { modification?: string; style?: string } | undefined
      const mod = v?.modification ? t(`opt.battleStyleMod.${v.modification}`) : ""
      return v?.modification === "SINGLE_STYLE" && v.style ? `${mod} · ${t(`opt.battleStyleStyle.${v.style}`)}` : mod
    }
    case "customStarter":
      return Array.isArray(value) ? (value as number[]).join(" · ") : String(value)
    case "miscBitmask": {
      const n = typeof value === "number" ? value : 0
      const count = MISC_BITS.filter((b) => (n & b.mask) !== 0).length
      return t("chrome.miscOn", { count })
    }
    default:
      return String(value)
  }
}
