"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { cn } from '@boffmedia/ui'
import {
  mewChance, mewFixedChance, mewPct, mewRollKind, mewStatFlags,
  MEW_CHECK_STATS, MEW_NO_STAT_BASE,
  type MewCheckStat, type MewChanceResult, type MewOptionRoll,
} from "../../mew-chance"

// The event probability calculator.
//
// Sliders live ON each option and show only the stats that option actually
// rolls against — a charisma check gets CHA + LCK, an option with no stat key
// gets LCK alone. The values are held once per event, so moving luck inside one
// option moves it for every option on the page.

export interface MewCatStats {
  str: number; dex: number; con: number; int: number; spd: number; cha: number; lck: number
  difficulty: number
}

export const MEW_DEFAULT_STATS: MewCatStats = { str: 5, dex: 5, con: 5, int: 5, spd: 5, cha: 5, lck: 5, difficulty: 0 }

const STAT_KEY: Record<MewCheckStat, string> = {
  str: "stat.str", dex: "stat.dex", con: "stat.con", int: "stat.int", spd: "stat.spd", cha: "stat.cha", lck: "stat.lck",
}

export interface MewOptionOdds {
  roll: MewOptionRoll
  chance: MewChanceResult
  /** Set only for a real stat check whose stat is uniquely the cat's worst/best. */
  lowest: boolean
  highest: boolean
}

/** Classify an option and compute its odds, or null when it is not a roll. */
export function mewOptionOdds(
  stats: MewCatStats,
  o: { stat?: string; fixedChance?: number; hasBad: boolean; hasTiers: boolean },
): MewOptionOdds | null {
  const roll = mewRollKind(o)
  if (!roll) return null
  if (roll.kind === "stat" && roll.stat) {
    const { lowest, highest } = mewStatFlags(stats, roll.stat)
    return {
      roll,
      lowest,
      highest,
      chance: mewChance({ stat: stats[roll.stat], luck: stats.lck, difficulty: stats.difficulty, lowest, highest }),
    }
  }
  const base = roll.kind === "fixed" ? (o.fixedChance ?? MEW_NO_STAT_BASE) : MEW_NO_STAT_BASE
  return { roll, lowest: false, highest: false, chance: mewFixedChance(base, stats.lck) }
}

/**
 * One stat input. A stepper, not a range slider: a range stretched to whatever
 * width the flex row gave it, so the same control was full-width on an option
 * with one input and a third as wide on an option with three, and a 0-20
 * integer was fiddly to hit by drag and impossible to type. This has a fixed
 * footprint, takes a typed value, and steps with the keyboard.
 */
function StatStepper({ id, label, value, min, max, onChange, tone }: { id: string; label: string; value: number; min: number; max: number; onChange: (v: number) => void; tone?: "low" | "high" }) {
  const t = useToolT(MEWGENICS_NS)
  const clamp = (v: number) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : min)
  const step = (d: number) => onChange(clamp(value + d))

  const btn = "grid w-[1.625rem] flex-none place-items-center text-[0.9375rem]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] transition-colors hover:bg-[color:var(--mwp-paper-3)] disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:bg-[color:var(--mwp-paper-3)]"

  return (
    <div className="flex w-[6.5rem] flex-none flex-col gap-[0.3125rem]">
      <label
        htmlFor={id}
        className={cn(
          "text-[0.65625rem]/none uppercase tracking-[0.06em] [font-family:var(--mwf-disp)]",
          tone === "low" ? "text-[color:var(--mwp-bad)]" : tone === "high" ? "text-[color:var(--mwp-good)]" : "text-[color:var(--mwp-ink-soft)]",
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "flex h-[1.875rem] items-stretch overflow-hidden border-2 border-solid bg-[color:var(--mwp-paper)] [border-radius:6px] focus-within:ring-2 focus-within:ring-[color:var(--mwp-red)]",
          tone === "low" ? "border-[color:var(--mwp-bad)]" : tone === "high" ? "border-[color:var(--mwp-good)]" : "border-[color:var(--mwp-ink)]",
        )}
      >
        <button type="button" className={btn} onClick={() => step(-1)} disabled={value <= min} aria-label={t("event.calc.decrease", { stat: label })} tabIndex={-1}>−</button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          onBlur={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          className="mew-num w-full min-w-0 flex-1 border-x-2 border-solid border-[color:var(--mwp-ink-line)] bg-transparent text-center font-mono text-[0.875rem]/none font-bold text-[color:var(--mwp-ink)] focus-visible:outline-none"
        />
        <button type="button" className={btn} onClick={() => step(1)} disabled={value >= max} aria-label={t("event.calc.increase", { stat: label })} tabIndex={-1}>+</button>
      </div>
    </div>
  )
}

const LEAVES = [
  { key: "goodRare", cls: "bg-[color:var(--mwp-good)]", label: "event.outcome.goodRare" },
  { key: "goodCommon", cls: "bg-[color-mix(in_srgb,var(--mwp-good)_50%,var(--mwp-paper))]", label: "event.outcome.goodCommon" },
  { key: "badCommon", cls: "bg-[color-mix(in_srgb,var(--mwp-bad)_50%,var(--mwp-paper))]", label: "event.outcome.badCommon" },
  { key: "badRare", cls: "bg-[color:var(--mwp-bad)]", label: "event.outcome.badRare" },
] as const

// An option with no failure branch still splits its reward common/rare, so only
// those two leaves exist and there is no success rate to speak of.
const TIER_LEAVES = [
  { key: "goodRare", cls: "bg-[color:var(--mwp-good)]", label: "event.tier.rare" },
  { key: "goodCommon", cls: "bg-[color-mix(in_srgb,var(--mwp-good)_50%,var(--mwp-paper))]", label: "event.tier.common" },
] as const

/**
 * One option's odds band: its own sliders, the stacked bar, and the legend.
 * Rendered inline in the option card, not in a box of its own.
 */
export function MewOptionChance({ odds, stats, onChange, idPrefix }: { odds: MewOptionOdds; stats: MewCatStats; onChange: (s: MewCatStats) => void; idPrefix: string }) {
  const t = useToolT(MEWGENICS_NS)
  const { roll, chance, lowest, highest } = odds
  const tierOnly = roll.kind === "tier"
  const leaves = tierOnly ? TIER_LEAVES : LEAVES
  // A tier-only option's two leaves are the whole reward, so renormalise them
  // against the good branch instead of against a success roll that never fires.
  const value = (k: string) => (tierOnly ? (k === "goodRare" ? chance.rare : 1 - chance.rare) : chance[k as keyof MewChanceResult] as number)
  const summary = leaves.map((l) => `${t(l.label)} ${mewPct(value(l.key))}`).join(" · ")

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5">
        {roll.inputs.map((k) => (
          <StatStepper
            key={k}
            id={`${idPrefix}-${k}`}
            label={t(STAT_KEY[k])}
            value={stats[k]}
            min={0}
            max={20}
            onChange={(v) => onChange({ ...stats, [k]: v })}
            tone={roll.stat === k ? (lowest ? "low" : highest ? "high" : undefined) : undefined}
          />
        ))}
        {roll.usesDifficulty && (
          <StatStepper
            id={`${idPrefix}-dif`}
            label={t("event.calc.difficultyShort")}
            value={stats.difficulty}
            min={0}
            max={20}
            onChange={(v) => onChange({ ...stats, difficulty: v })}
          />
        )}
        {(lowest || highest) && (
          <span className={cn(
            "mb-[0.4375rem] inline-flex items-center gap-1 border-[1.5px] border-solid px-2 pb-[3px] pt-[0.25rem] text-[0.59375rem]/none uppercase tracking-[0.06em] [font-family:var(--mwf-disp)] [border-radius:4px]",
            lowest
              ? "border-[color-mix(in_srgb,var(--mwp-bad)_50%,transparent)] text-[color:var(--mwp-bad)]"
              : "border-[color-mix(in_srgb,var(--mwp-good)_50%,transparent)] text-[color:var(--mwp-good)]",
          )}>
            {t(lowest ? "event.calc.isLowest" : "event.calc.isHighest")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[0.75rem]/none font-bold">
        {tierOnly ? (
          <span className="text-[color:var(--mwp-ink-soft)]">{t("event.calc.tierOnly")}</span>
        ) : (
          <span className="text-[color:var(--mwp-good)]">{t("event.calc.success")} {mewPct(chance.success)}</span>
        )}
        <span className="text-[color:var(--mwp-ink-soft)]">{t("event.calc.rare")} {mewPct(chance.rare)}</span>
      </div>

      <div
        role="img"
        aria-label={summary}
        className="flex h-[0.875rem] w-full overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-3)] [border-radius:5px]"
      >
        {leaves.map((l) => {
          const v = value(l.key)
          if (v <= 0) return null
          return <i key={l.key} className={cn("block h-full transition-[width] duration-300 ease-out", l.cls)} style={{ width: v * 100 + "%" }} />
        })}
      </div>

      <dl className="m-0 grid gap-x-4 gap-y-px [grid-template-columns:repeat(auto-fit,minmax(8.25rem,1fr))]">
        {leaves.map((l) => (
          <div className="flex items-baseline justify-between gap-2 py-[2px]" key={l.key}>
            <dt className="flex min-w-0 items-center gap-1.5 truncate text-[0.65625rem]/[1.2] uppercase tracking-[0.05em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">
              <span className={cn("h-2 w-2 flex-none border border-solid border-[color:var(--mwp-ink)]", l.cls)} />
              {t(l.label)}
            </dt>
            <dd className="m-0 flex-none font-mono text-[0.75rem]/[1.2] font-bold text-[color:var(--mwp-ink)]">{mewPct(value(l.key))}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Reset control for the whole event's stat line. */
export function MewChanceReset({ stats, onChange }: { stats: MewCatStats; onChange: (s: MewCatStats) => void }) {
  const t = useToolT(MEWGENICS_NS)
  const dirty = MEW_CHECK_STATS.some((k) => stats[k] !== MEW_DEFAULT_STATS[k]) || stats.difficulty !== 0
  if (!dirty) return null
  return (
    <button
      type="button"
      onClick={() => onChange(MEW_DEFAULT_STATS)}
      className="inline-flex items-center gap-1.5 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[0.3125rem] text-[0.6875rem]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] [box-shadow:0_2px_0_var(--mwp-shadow-sm)] transition-all hover:-translate-y-px active:translate-y-0.5 active:[box-shadow:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
    >
      {t("event.calc.reset")}
    </button>
  )
}

/**
 * The probability of one branch's tier — what "COMÚN" inside the success column
 * is actually worth. The column header only carries the branch total, so
 * without this a reader has to cross-reference the legend to learn that the
 * common success is 42.5% and the rare one 7.5%.
 */
export function mewTierPct(odds: MewOptionOdds, branch: "good" | "bad", tier: string): string | null {
  const { roll, chance } = odds
  if (roll.kind === "tier") {
    // No failure branch: the two tiers are the whole outcome.
    if (branch === "bad") return null
    return mewPct(tier === "rare" ? chance.rare : 1 - chance.rare)
  }
  if (branch === "good") return mewPct(tier === "rare" ? chance.goodRare : chance.goodCommon)
  return mewPct(tier === "rare" ? chance.badRare : chance.badCommon)
}
