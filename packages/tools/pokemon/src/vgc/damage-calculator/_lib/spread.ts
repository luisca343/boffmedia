/**
 * Spreads: recovering one, and guessing one honestly when it cannot be known.
 *
 * A live battle hands the player their own FINAL stats (Showdown's request
 * carries `stats`) and hands them nothing at all about the opponent's. The
 * calculator wants neither: it wants EVs, IVs and a nature, because that is
 * what @smogon/calc computes stats from.
 *
 * So there are two jobs here, and keeping them apart is the whole point:
 *
 *  - {@link solveSpread} INVERTS the stat formula. It is not an estimate: any
 *    (nature, EVs, IVs) triple that reproduces the known final stats produces
 *    exactly the same damage roll, so a solved spread is the real thing even
 *    when the trainer's actual EV split was different.
 *  - {@link minSpread} and {@link maxSpread} are ADMITTED GUESSES, for the side nobody can
 *    see. They exist so a caller can compute both ends of a range instead of
 *    inventing one precise number that will be wrong.
 *
 * Never let the second kind be mistaken for the first: `solveSpread` returns
 * `null` rather than falling back to a guess.
 */
import { calcStat, Generations } from '@smogon/calc'
import type { StatKey, StatValues } from '../_types/calculator'
import { NATURES, natureEffect, probeNature, type NatureEffect } from './natures'

const GEN9 = Generations.get(9)

/** The five stats a nature can touch. HP is solved separately. */
type OffDefStat = Exclude<StatKey, 'hp'>
const NON_HP: OffDefStat[] = ['atk', 'def', 'spa', 'spd', 'spe']

export interface KnownStats {
  /** Max HP. Optional: a request publishes it in `condition`, not in `stats`. */
  hp?: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface SolvedSpread {
  nature: string
  evs: StatValues
  ivs: StatValues
}

/**
 * One (iv, ev) pair standing for a whole class of them.
 *
 * The stat formula reads `iv + floor(ev / 4)` and nothing else about the two,
 * so every pair with the same sum is interchangeable. Scanning the SUM (95
 * values: 0..31 of IV plus 0..63 of EV/4) instead of the 32x64 grid is both
 * exhaustive and ~20x cheaper, and it is what makes this cheap enough to run on
 * every mon on the field each turn.
 */
function pairFor(sum: number): { iv: number; ev: number } | null {
  if (sum < 0 || sum > 94) return null
  if (sum <= 31) return { iv: sum, ev: 0 }
  return { iv: 31, ev: (sum - 31) * 4 }
}

/** The (iv, ev) with the smallest EV that yields `target`, or null. */
function invertStat(
  stat: StatKey,
  base: number,
  level: number,
  target: number,
  nature: string,
): { iv: number; ev: number } | null {
  for (let sum = 0; sum <= 94; sum++) {
    const pair = pairFor(sum)
    if (!pair) break
    if (calcStat(GEN9, stat, base, pair.iv, pair.ev, level, nature) === target) return pair
  }
  return null
}

const ZERO_EVS: StatValues = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
const PERFECT_IVS: StatValues = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }

/**
 * The spread that produces `known` for a species at `level`, or `null` when no
 * legal one does.
 *
 * `null` is a real answer, not a failure to try: a Champions-format stat (SP,
 * a different formula), a stat an in-battle forme change moved, or a hacked set
 * all land there, and every one of them must widen into a range rather than be
 * silently rounded to the nearest legal spread.
 */
export function solveSpread(base: StatValues, level: number, known: KnownStats): SolvedSpread | null {
  // Which nature multipliers can reach each stat at all. A stat is usually
  // reachable by two or three of them; the joint solve below picks a nature
  // that satisfies all five at once, which is the constraint a per-stat search
  // would happily violate (there is no nature that raises two stats).
  const options: Record<string, Partial<Record<NatureEffect, { iv: number; ev: number }>>> = {}
  for (const stat of NON_HP) {
    const found: Partial<Record<NatureEffect, { iv: number; ev: number }>> = {}
    for (const effect of ['neutral', 'plus', 'minus'] as NatureEffect[]) {
      const hit = invertStat(stat, base[stat], level, known[stat], probeNature(stat, effect))
      if (hit) found[effect] = hit
    }
    if (!found.neutral && !found.plus && !found.minus) return null
    options[stat] = found
  }

  let best: SolvedSpread | null = null
  let bestCost = Infinity
  for (const nature of NATURES) {
    const evs: StatValues = { ...ZERO_EVS }
    const ivs: StatValues = { ...PERFECT_IVS }
    let cost = 0
    let ok = true
    for (const stat of NON_HP) {
      const hit = options[stat][natureEffect(nature.name, stat)]
      if (!hit) { ok = false; break }
      evs[stat] = hit.ev
      ivs[stat] = hit.iv
      cost += hit.ev
    }
    if (!ok) continue
    // Cheapest total EVs wins. Several natures can fit the same stat line and
    // every one of them yields identical stats — so this is presentation, not
    // correctness: it shows the spread a human would have typed.
    if (cost < bestCost) { bestCost = cost; best = { nature: nature.name, evs, ivs } }
  }
  if (!best) return null

  if (known.hp != null) {
    // HP ignores the nature, so any of them probes it.
    const hp = invertStat('hp', base.hp, level, known.hp, best.nature)
    if (!hp) return null
    best.evs.hp = hp.ev
    best.ivs.hp = hp.iv
  }
  return best
}

/**
 * The stats a spread actually produces — the forward direction of
 * {@link solveSpread}, and the only way to check its answer.
 *
 * A solved spread is allowed to differ from the one the trainer typed (132 EVs
 * with a boosting nature and 252 with a neutral one can land on the same
 * number), so "did it return 252" is not the property that matters. "Does it
 * reproduce the stat line" is.
 */
export function spreadStats(base: StatValues, level: number, spread: SolvedSpread): StatValues {
  const out = {} as StatValues
  for (const stat of ['hp', ...NON_HP] as StatKey[]) {
    out[stat] = calcStat(GEN9, stat, base[stat], spread.ivs[stat], spread.evs[stat], level, spread.nature)
  }
  return out
}

/* ── Admitted guesses ────────────────────────────────────────────────────── */

/**
 * The two ends of "we do not know this Pokémon's spread".
 *
 * 0 EVs with a neutral nature at the floor, 252 EVs with a boosting nature at
 * the ceiling — the convention every damage calculator prints as `0-` / `252+`.
 * The floor is neutral rather than hindering on purpose: a hindering nature on
 * a defence is legal but rare, and widening the range to cover it would make
 * almost every calculation read as "anything can happen", which is the failure
 * mode this range exists to avoid.
 */
export interface SpreadGuess {
  nature: string
  evs: StatValues
  ivs: StatValues
}

/** Boosting natures, one per stat, for the ceiling guess. */
const BOOST_NATURE: Record<StatKey, string> = {
  hp: 'Serious', atk: 'Adamant', def: 'Impish', spa: 'Modest', spd: 'Careful', spe: 'Jolly',
}

/** The frailest/weakest legal spread: nothing invested, perfect IVs. */
export function minSpread(): SpreadGuess {
  return { nature: 'Serious', evs: { ...ZERO_EVS }, ivs: { ...PERFECT_IVS } }
}

/**
 * The most invested plausible spread for one job: 252 in `stat` with the nature
 * that raises it, plus 252 HP when the job is taking a hit rather than dealing
 * one (a wall invests in both; an attacker's HP does not change its damage).
 */
export function maxSpread(stat: StatKey, opts: { withHp?: boolean } = {}): SpreadGuess {
  const evs: StatValues = { ...ZERO_EVS, [stat]: 252 }
  if (opts.withHp) evs.hp = 252
  return { nature: BOOST_NATURE[stat], evs, ivs: { ...PERFECT_IVS } }
}
