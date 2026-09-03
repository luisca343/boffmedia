/**
 * Team validation over @pkmn/sim's TeamValidator.
 *
 * Does not throw on unknown format; returns ok:false with a problem string instead.
 */

import { Dex, TeamValidator, type PokemonSet } from '@pkmn/sim';

import { getFormat, isKnownFormat, statLimitsFor } from '../formats.js';
import { registerBattleMods } from '../mods/register.js';

export interface ValidationResult {
  ok: boolean;
  problems: string[];
}


/**
 * The sim's hard-coded over-budget message, as emitted by `TeamValidator`
 * (`sim/team-validator.ts`, the `totalEV > evLimit` branch).
 */
const EV_TOTAL_PROBLEM = /^(.+?) has \d+ total EVs, which is more than this format's limit of \d+\.$/;

/**
 * Drop the sim's EV-worded total-budget complaint on a Stat Point format.
 *
 * Champions keeps `EV Limit = 66` so `ruleTable.evLimit` stays machine-correct
 * for everything inside the sim that reads it — but a Champions player has
 * never heard of an EV, and the legality panel shows these strings verbatim.
 * The `Stat Point Limit` rule already reports the same thing in SP wording, so
 * the EV-worded twin is removed here, at the reporting boundary.
 *
 * Deliberately SOFT: a line is dropped only when the SP-worded replacement for
 * the SAME Pokémon is present in the list. If @pkmn/sim ever reshapes that
 * template the regex simply stops matching and both messages come back — never
 * zero messages, and never a throw.
 */
function preferStatPointWording(problems: string[]): string[] {
  return problems.filter((problem) => {
    const match = EV_TOTAL_PROBLEM.exec(problem);
    if (!match) return true;
    const subject = match[1];
    const replaced = problems.some(
      (other) =>
        other !== problem &&
        other.startsWith(`${subject} has `) &&
        other.includes('Stat Points in total'),
    );
    return !replaced;
  });
}

/**
 * The sim's gen-worded existence templates, as emitted by `TeamValidator`
 * (`sim/team-validator.ts`). Every one of them interpolates `dex.gen`, which
 * for our modded formats is still 9 — so the sentence is true and useless.
 *
 * The first pattern is the shared shape of five call sites, all reached from
 * the `nonexistent` rule check on an `isNonstandard: 'Past' | 'Future'` entry:
 *
 *   `${tierSpecies.name} does not exist in Gen ${dex.gen}.`            (species)
 *   `${set.name}'s item ${item.name} does not exist in Gen ${dex.gen}.`
 *   `${set.name}'s move ${move.name} does not exist in Gen ${dex.gen}.`
 *   `${set.name}'s ability ${ability.name} does not exist in Gen ${dex.gen}.`
 *   `${set.name}'s nature ${nature.name} does not exist in Gen ${dex.gen}.`
 *
 * The second is `checkMove`'s `Unobtainable` branch, whose ` in Gen ${dex.gen}`
 * suffix only appears from Gen 9 on — i.e. exactly on our formats.
 *
 * Anchored at both ends so a partial match cannot mangle a longer sentence.
 * The `this game` / `Let's Go` / CAP variants carry no generation and are left
 * alone; so are the Gen 1/2-only templates, which cannot fire for a Gen 9 dex.
 */
const GEN_WORDED_PROBLEMS: readonly RegExp[] = [
  /^(.+?) does not exist in Gen \d+\.$/,
  /^(.+?) is not obtainable without hacking or glitches in Gen \d+\.$/,
];

/**
 * Name the FORMAT instead of the generation, on custom formats only.
 *
 *   Basculegion's item Life Orb does not exist in Gen 9.
 *   -> Basculegion's item Life Orb is not available in VGC 2026 Reg M-A (Champions).
 *
 * Life Orb really is illegal in Reg M-A — `mods/champions/regma/items.ts`
 * marks it `isNonstandard: 'Past'` — but the sim can only word that as "Gen 9",
 * because the generation genuinely is 9 and the sim has no idea a regulation
 * took the item away. A player reads "does not exist in Gen 9" as "this item is
 * not in the game" and goes looking for a bug that is not there.
 *
 * Vanilla formats are deliberately untouched: on `gen9ou` or `gen9vgc2025regi`
 * "Gen 9" is both accurate and the wording competitive players already use.
 *
 * Deliberately SOFT, like `preferStatPointWording`: a problem that matches no
 * template passes through byte-for-byte. This is a 1:1 rewrite — the array that
 * comes out always has the same length as the one that went in.
 */
function preferFormatWording(problems: string[], label: string): string[] {
  return problems.map((problem) => {
    for (const pattern of GEN_WORDED_PROBLEMS) {
      const match = pattern.exec(problem);
      if (match?.[1]) return `${match[1]} is not available in ${label}.`;
    }
    return problem;
  });
}

export function validateTeam(format: string, team: PokemonSet[]): ValidationResult {
  // Idempotent, and defensive: a caller that forgot to register the mods would
  // otherwise get a phantom "Format not found" for a format that exists.
  registerBattleMods();

  // Check if format is known
  if (!isKnownFormat(format)) {
    return {
      ok: false,
      problems: [`Unknown format: ${format}`],
    };
  }

  if (!team || !Array.isArray(team) || team.length === 0) {
    return {
      ok: false,
      problems: ['Team is empty'],
    };
  }

  try {
    // Resolve the format on the BASE Dex, never on `Dex.forFormat(...)`.
    //
    // `DexFormats.rulesetCache` is PER-DEX. `Dex.formats.extend()` — how every
    // custom format here gets registered — populates only the base Dex's cache,
    // so a modded dex has never heard of `gen9championsvgc2026regmb` or
    // `gen9teras`. On a miss, `DexFormats.get()` does not return undefined: it
    // returns `new Format({id, name, exists: false})`, and `Format`'s
    // constructor defaults `effectType` to `'Condition'`. `TeamValidator`'s
    // constructor then throws
    //   `format should be a 'Format', but was a 'Condition'`
    // which is what a player saw instead of a legality check. This was never
    // Champions-specific — `gen9teras` had exactly the same latent bug.
    //
    // Handing the Format OBJECT (not the id string) to `new TeamValidator(fmt)`
    // is also deliberate: its constructor resolves the modded dex itself via
    // `Dex.forFormat(this.format)`, so the mod is still applied — we just stop
    // asking the wrong dex to name the format in the first place.
    const fmt = Dex.formats.get(format);
    if (!fmt?.exists || fmt.effectType !== 'Format') {
      return {
        ok: false,
        problems: [`Format not found: ${format}`],
      };
    }

    const bsimFormat = getFormat(format);

    const validator = new TeamValidator(fmt);
    const raw = validator.validateTeam(team);
    let problems = raw;
    if (problems && statLimitsFor(format).system === 'sp') {
      problems = preferStatPointWording(problems);
    }
    if (problems && bsimFormat?.custom) {
      problems = preferFormatWording(problems, bsimFormat.label);
    }

    if (problems && problems.length > 0) {
      return {
        ok: false,
        problems,
      };
    }

    return {
      ok: true,
      problems: [],
    };
  } catch (error: any) {
    return {
      ok: false,
      problems: [`Validation error: ${error.message}`],
    };
  }
}
