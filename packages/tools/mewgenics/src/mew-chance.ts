// Event stat-check probability model.
//
// The engine itself is compiled, so this is a port of the formula the official
// wiki publishes on Template:EventChoice (mewgenics.wiki.gg) — the only place
// the numbers are written down. `dump/data` carries the option's tested stat
// but no difficulty and no odds, so nothing here can be derived from the
// extracted JSON; keep the wiki as the source of truth when it moves.
//
// The shape of it:
//   1. the tested stat maps linearly onto a base success chance (5% … 95%),
//   2. luck turns that single roll into `nv` rolls — best-of above 5 luck,
//      worst-of below it, with the fractional part interpolated,
//   3. the same luck transform is applied to a flat 15% "rare" threshold,
//   4. success and rare are independent, so each branch splits 85/15.
//
// Sanity anchor (matches the wiki's own worked example, and mew-chance.test):
//   stat 5, luck 5, difficulty 0 → 50.0% success, 15.0% rare
//   → good rare 7.5% · good common 42.5% · bad common 42.5% · bad rare 7.5%

/** Flat rare threshold before luck is applied. */
export const MEW_RARE_BASE = 0.15

/** The seven real stats an event can test. Anything else is not a stat roll. */
export const MEW_CHECK_STATS = ["str", "dex", "con", "int", "spd", "cha", "lck"] as const
export type MewCheckStat = (typeof MEW_CHECK_STATS)[number]

export function mewIsCheckStat(stat?: string): stat is MewCheckStat {
  return !!stat && (MEW_CHECK_STATS as readonly string[]).includes(stat)
}

/**
 * Is this stat the cat's worst / best?
 *
 * It must be UNIQUELY the extreme. Treating "equal to the minimum" as lowest
 * makes six stats tied at 5 all count as the cat's worst the moment luck alone
 * is raised above them — which showed up as raising luck *lowering* a charisma
 * check from 50% to 28.7%. A tie means the cat has no single worst stat.
 */
export function mewStatFlags(values: Record<MewCheckStat, number>, stat: MewCheckStat): { lowest: boolean; highest: boolean } {
  const all = MEW_CHECK_STATS.map((k) => values[k])
  const min = Math.min(...all)
  const max = Math.max(...all)
  const v = values[stat]
  return {
    lowest: v === min && all.filter((x) => x === min).length === 1,
    highest: v === max && all.filter((x) => x === max).length === 1,
  }
}

export interface MewChanceInput {
  /** The tested stat's value on the cat attempting the option. */
  stat: number
  /** The cat's luck. 5 is neutral: above it rerolls in your favour, below against. */
  luck: number
  /** Check difficulty. Not present in the extracted data — 0 unless the user sets it. */
  difficulty?: number
  /** The tested stat is the cat's lowest (penalty) / highest (bonus). */
  lowest?: boolean
  highest?: boolean
}

export interface MewChanceResult {
  /** Chance the option succeeds at all, 0…1. */
  success: number
  /** Chance an outcome rolls its rare variant, 0…1. Independent of success. */
  rare: number
  /** The four leaf probabilities, 0…1. They always sum to 1. */
  goodRare: number
  goodCommon: number
  badCommon: number
  badRare: number
  /** Luck after the lowest/highest adjustment — what actually drove the reroll. */
  luckEffective: number
}

/**
 * Luck as a reroll count. `kv = |luck - 5| / 10` gives whole rerolls plus a
 * fraction; at or above 5 luck you take the best of them, below it the worst.
 */
function applyLuck(base: number, luck: number): number {
  const kv = Math.abs((luck - 5) / 10)
  const frac = kv - Math.floor(kv)
  const n = 1 + Math.floor(kv)
  return luck >= 5
    ? 1 - Math.pow(1 - base, n) * (1 - base * frac)
    : Math.pow(base, n) * (1 - frac * (1 - base))
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function mewChance({ stat, luck, difficulty = 0, lowest, highest }: MewChanceInput): MewChanceResult {
  const lo = lowest ? 1 : 0
  const hi = highest ? 1 : 0
  // The tested stat is nudged ±2 points and luck ±2.5 when it is the cat's
  // worst/best stat — the game's own "you are bad at this" thumb on the scale.
  const statCalc = clamp01((stat - difficulty + lo * -2 + hi * 2) / 10)
  const luckEffective = luck + lo * -2.5 + hi * 2.5
  // 0…1 of the stat range maps onto 5%…95%, never a certainty either way.
  const norm = (90 * statCalc + 5) / 100

  const success = clamp01(applyLuck(norm, luckEffective))
  const rare = clamp01(applyLuck(MEW_RARE_BASE, luckEffective))

  return {
    success,
    rare,
    goodRare: success * rare,
    goodCommon: success * (1 - rare),
    badCommon: (1 - success) * (1 - rare),
    badRare: (1 - success) * rare,
    luckEffective,
  }
}

/**
 * The base an untested option rolls against. An option with no `stat` key still
 * has good AND bad branches (Crack in the Wall's "use equipped weapon"), so it
 * IS a roll — it just has nothing to compare a stat against, which is the
 * neutral middle of the 5%-95% band. Only luck moves it.
 */
export const MEW_NO_STAT_BASE = 0.5

/**
 * An option whose odds do not come from a stat: a flat `fixed_chance`, or the
 * neutral base above. Luck still decides common vs rare either way.
 */
export function mewFixedChance(fixed: number, luck: number): MewChanceResult {
  const success = clamp01(applyLuck(clamp01(fixed), luck))
  const rare = clamp01(applyLuck(MEW_RARE_BASE, luck))
  return {
    success,
    rare,
    goodRare: success * rare,
    goodCommon: success * (1 - rare),
    badCommon: (1 - success) * (1 - rare),
    badRare: (1 - success) * rare,
    luckEffective: luck,
  }
}

/** 0.425 → "42.5%" (one decimal, trailing ".0" kept so columns line up). */
export function mewPct(v: number): string {
  return (v * 100).toFixed(1) + "%"
}

/**
 * What kind of roll an event option is, and therefore which stats matter to it.
 *
 *  - `stat`  — a real stat check: that stat AND luck (and difficulty).
 *  - `luck`  — no stat tested but both branches exist: luck only.
 *  - `fixed` — a hard-coded `fixed_chance`: luck only, and only for the tier.
 *  - `tier`  — no failure branch, but the reward splits common/rare: luck only,
 *              and there is no success rate to show.
 *  - `null`  — a flat outcome. Nothing to calculate.
 */
export type MewRollKind = "stat" | "luck" | "fixed" | "tier"

export interface MewOptionRoll {
  kind: MewRollKind
  /** The tested stat, when there is one. */
  stat?: MewCheckStat
  /** Every stat slider this option should show, in display order. */
  inputs: MewCheckStat[]
  /** Whether the difficulty input is meaningful (only a real stat check). */
  usesDifficulty: boolean
}

export function mewRollKind(opts: {
  stat?: string
  fixedChance?: number
  hasBad: boolean
  hasTiers: boolean
}): MewOptionRoll | null {
  const { stat, fixedChance, hasBad, hasTiers } = opts
  if (mewIsCheckStat(stat)) {
    return {
      kind: "stat",
      stat,
      // A luck check is already the luck slider — do not show it twice.
      inputs: stat === "lck" ? ["lck"] : [stat, "lck"],
      usesDifficulty: true,
    }
  }
  if (fixedChance != null) return { kind: "fixed", inputs: ["lck"], usesDifficulty: false }
  if (hasBad) return { kind: "luck", inputs: ["lck"], usesDifficulty: false }
  if (hasTiers) return { kind: "tier", inputs: ["lck"], usesDifficulty: false }
  return null
}
