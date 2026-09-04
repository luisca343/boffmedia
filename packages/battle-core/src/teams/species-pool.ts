/**
 * "Which Pokémon may this format use?"
 *
 * The teambuilder's species picker needs this for the same reason the move
 * picker needs `legalMovesFor`: a Champions regulation has its own roster, and
 * offering Lapras for VGC 2026 Reg M-A with no warning — then having the
 * validator object after the fact — is a worse tool than one that says so up
 * front.
 *
 * There is no `getMovePool` equivalent for species in the sim, so this mirrors
 * the two gates `TeamValidator.validateSet` actually applies, in its order:
 *
 *   1. EXISTENCE. A species carrying `isNonstandard` ('Past', 'Future', 'LGPE',
 *      'CAP', 'Unobtainable', 'Gigantamax') is out unless the format re-admits
 *      it — which is what National Dex does with `+Past`. The validator spells
 *      this as `Tags.nonexistent.genericFilter(...) && ruleTable.check(...)`;
 *      `Tags` is not public API, so the same question is asked of the rule
 *      table directly.
 *   2. BANS. `ruleTable.isBannedSpecies` already folds in explicit `-pokemon:`
 *      entries, base-forme bans and every tier tag (Uber, Restricted Legendary,
 *      Mythical…), so tier bans need no special casing here.
 *
 * This is a HINT for the picker, never an authority: the answer is marked in
 * the list and the set is still allowed, exactly as illegal moves are. The
 * validator remains the thing that decides whether a team is legal.
 */

import { Dex } from '@pkmn/sim';

import { registerBattleMods } from '../mods/register.js';

export interface LegalSpecies {
  /** Species ids (e.g. `garganacl`, `fluttermane`), sorted. */
  species: string[];
  /**
   * `false` = could not determine — unknown format, or a lookup that threw.
   * Callers must fall back to marking nothing rather than presenting an empty
   * pool as "this format has no legal Pokémon".
   */
  known: boolean;
}

const UNKNOWN: LegalSpecies = { species: [], known: false };

/** The `+pokemontag:` name a nonstandard reason maps to. */
const EXISTENCE_TAG: Record<string, string> = {
  Past: 'past',
  Future: 'future',
  LGPE: 'lgpe',
  CAP: 'cap',
  Unobtainable: 'unobtainable',
  Gigantamax: 'gigantamax',
  Custom: 'custom',
};

/**
 * Metadata for a species available in the picker.
 * Includes enough data for the teambuilder picker's display and search.
 */
export interface SpeciesPickerData {
  id: string;
  name: string;
  types: string[];
  bst: number;
  /** For sorting: the official Pokédex number, or high number for modded. */
  num: number;
}

/**
 * All species available in the modded dex, including Champions Megas and Teras.
 * Used by the teambuilder picker to show all available species before filtering
 * by format legality. This is a hint for the UI, never an authority.
 */
export interface AllSpecies {
  /** All available species with picker metadata. */
  species: SpeciesPickerData[];
  /** Always true; included for protocol consistency with legalSpeciesFor. */
  known: boolean;
}

export function allAvailableSpecies(): AllSpecies {
  registerBattleMods();

  try {
    const out: SpeciesPickerData[] = [];
    for (const species of Dex.species.all()) {
      if (!species.exists || species.num <= 0 || species.battleOnly) continue;
      out.push({
        id: species.id,
        name: species.name,
        types: [...species.types],
        bst: species.bst || 0,
        num: species.num || 999,
      });
    }
    out.sort((a, b) => a.num - b.num || a.name.localeCompare(b.name));
    return { species: out, known: true };
  } catch {
    return { species: [], known: false };
  }
}

export function legalSpeciesFor(formatId: string): LegalSpecies {
  registerBattleMods();

  try {
    // Base Dex for the format lookup — the per-dex `rulesetCache` means a
    // modded dex has never heard of our custom formats. See `validate.ts`.
    const fmt = Dex.formats.get(formatId);
    if (!fmt?.exists || fmt.effectType !== 'Format') return UNKNOWN;

    const dex = Dex.forFormat(fmt);

    // Without a rule table there are no bans to apply, and a list that claims
    // everything is legal would be a lie the picker draws in red.
    let ruleTable;
    try {
      ruleTable = dex.formats.getRuleTable(fmt);
    } catch {
      return UNKNOWN;
    }

    const bansNonexistent = ruleTable.isBanned('nonexistent');
    const out: string[] = [];

    for (const species of dex.species.all()) {
      if (!species.exists) continue;

      if (species.isNonstandard) {
        const tag = EXISTENCE_TAG[species.isNonstandard];
        const readmitted =
          ruleTable.has(`+pokemon:${species.id}`) || (tag ? ruleTable.has(`+pokemontag:${tag}`) : false);
        if (!readmitted && bansNonexistent) continue;
      }

      if (ruleTable.isBannedSpecies(species)) continue;

      out.push(species.id);
    }

    if (!out.length) return UNKNOWN;

    out.sort();
    return { species: out, known: true };
  } catch {
    return UNKNOWN;
  }
}
