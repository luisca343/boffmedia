/**
 * Pokémon Champions "Stat Points" (SP) — the cap rule upstream does not ship.
 *
 * Champions replaces EVs/IVs with Stat Points. Every Pokémon is level 50 with
 * 31 IVs (IVs are no longer a choice), and instead of spreading 508/510 EVs you
 * spend SP: **up to 32 in any one stat, 66 in total**.
 *
 * SP is stored in the `evs` field of a `PokemonSet`, exactly as the vendored
 * upstream mod does it, so packed/paste serialisation stays byte-compatible
 * with Showdown. The conversion is **1 SP = 8 EVs**, and at level 50 that is
 * also exactly +1 to the final stat:
 *
 *   mainline, level 50, non-HP : floor((2B + 31 + floor(EV/4)) * 50/100) + 5
 *                              = B + EV/8 + 20            (for EV = 8·SP)
 *   mainline, level 50, HP     : floor((2B + 31 + floor(EV/4)) * 50/100) + 60
 *                              = B + EV/8 + 75
 *
 * which is precisely the mod's own `statModify` in `./scripts.ts` (the branch
 * without `levelclausemod`, which none of our champions formats enable):
 *
 *   hp    = base + SP + 75
 *   other = nature × (base + SP + 20)
 *
 * Upstream ships NO cap for this. Left alone, champions formats inherit
 * `Obtainable` → `EV Limit = Auto` → 510, and @pkmn/sim's validator has no
 * per-stat cap below 255 — so a Champions team could legally be built with
 * absurd stats. This file supplies the missing cap as a real format rule
 * (a `ValidatorRule` in the `champions` mod's Rulesets table) rather than as a
 * special case wired into our validator, so it composes with everything else
 * the rule table does and shows up in `ruleTable` like any other clause.
 */

import type { ModdedFormatDataTable, PokemonSet, TeamValidator } from '@pkmn/sim';

export type ChampionsStatId = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

/** Max SP in any single stat. */
export const CHAMPIONS_SP_PER_STAT = 32;
/** Max SP across all six stats. */
export const CHAMPIONS_SP_TOTAL = 66;
/** 1 SP is worth this many EVs (and, at level 50, exactly +1 to the stat). */
export const CHAMPIONS_EVS_PER_SP = 8;
/** Champions Pokémon are always this level. */
export const CHAMPIONS_FIXED_LEVEL = 50;
/** Champions Pokémon always have this IV in every stat. */
export const CHAMPIONS_FIXED_IV = 31;

/** Rule name as it appears in a format's `ruleset`. */
export const CHAMPIONS_SP_RULE_NAME = 'Stat Point Limit';
/** `toID(CHAMPIONS_SP_RULE_NAME)` — the key in the Rulesets table. */
export const CHAMPIONS_SP_RULE_ID = 'statpointlimit';

/**
 * Appended to every champions format's `ruleset` by `registerChampionsMods()`.
 *
 * `!!` (repeal-and-replace) is load-bearing on the EV Limit line: `Flat Rules`
 * / `Standard` already pull in `Obtainable`, which sets `EV Limit = Auto`, and
 * @pkmn/sim throws `Rule "evlimit=66" conflicts with "evlimit=Auto"` for a
 * plain second value — in either order. Keep this AFTER the inherited rules.
 *
 * The total is enforced twice on purpose: `EV Limit = 66` is the sim's own
 * hard-coded check (and it is what `ruleTable.evLimit` reports to anything else
 * that asks), while our rule repeats it with SP wording so a player is not told
 * about "EVs" in a format that has none.
 */
export const CHAMPIONS_SP_FORMAT_RULES: readonly string[] = [
  `${CHAMPIONS_SP_RULE_NAME} = ${CHAMPIONS_SP_PER_STAT}`,
  `!! EV Limit = ${CHAMPIONS_SP_TOTAL}`,
];

const STAT_IDS: readonly ChampionsStatId[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

const STAT_NAMES: Record<ChampionsStatId, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Special Attack',
  spd: 'Special Defense',
  spe: 'Speed',
};

function validateStatPoints(this: TeamValidator, set: PokemonSet): string[] {
  const problems: string[] = [];

  const perStat = Number(this.ruleTable.valueRules.get(CHAMPIONS_SP_RULE_ID)) || CHAMPIONS_SP_PER_STAT;
  const totalLimit = this.ruleTable.evLimit ?? CHAMPIONS_SP_TOTAL;

  const name = set.name || set.species;
  const evs = (set.evs ?? {}) as Partial<Record<ChampionsStatId, number>>;

  let total = 0;
  for (const stat of STAT_IDS) {
    const sp = evs[stat] ?? 0;
    if (!Number.isInteger(sp) || sp < 0) {
      problems.push(`${name} has an invalid number of Stat Points in ${STAT_NAMES[stat]}.`);
      continue;
    }
    total += sp;
    if (sp > perStat) {
      problems.push(`${name} has ${sp} Stat Points in ${STAT_NAMES[stat]}, but the maximum is ${perStat}.`);
    }
  }

  if (total > totalLimit) {
    problems.push(`${name} has ${total} Stat Points in total, but the maximum is ${totalLimit}.`);
  }

  return problems;
}

/**
 * The extra Rulesets entry merged into the `champions` mod's table.
 *
 * `championsregma` declares `inherit: 'champions'` in its Scripts and ships no
 * Rulesets of its own, so it inherits this for free — which is why Reg M-A and
 * Reg M-B both resolve the rule.
 */
export const CHAMPIONS_SP_RULESET = {
  [CHAMPIONS_SP_RULE_ID]: {
    effectType: 'ValidatorRule',
    name: CHAMPIONS_SP_RULE_NAME,
    desc: `Maximum Stat Points in any single stat (Champions stores SP in the EV field; 1 SP = ${CHAMPIONS_EVS_PER_SP} EVs = +1 to the stat at level ${CHAMPIONS_FIXED_LEVEL}).`,
    hasValue: 'positive-integer',
    onValidateSet: validateStatPoints,
  },
} as unknown as ModdedFormatDataTable;
