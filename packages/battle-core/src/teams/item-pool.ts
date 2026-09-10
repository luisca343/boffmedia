/**
 * Format-aware held-item data for team-building surfaces.
 *
 * Item data cannot be read from the global Dex: a regulation can add an item
 * through a mod, remove a normally standard item, or allow an item whose
 * modded entry has no Pokédex number yet. TeamValidator is the simulator's
 * authority for that complete question, so this module asks it directly.
 */

import { Dex, TeamValidator, type PokemonSet } from '@pkmn/sim';

import { registerBattleMods } from '../mods/register.js';

export interface ItemPickerData {
  /** Showdown item ID, e.g. `golisopite`. */
  id: string;
  /** Display name, with a safe fallback for mod entries missing base metadata. */
  name: string;
  /** Short description for a picker or tooltip. */
  shortDesc: string;
}

export interface LegalItems {
  /** Items that may be held by a set in this format, sorted by display name. */
  items: ItemPickerData[];
  /** False means the format could not be resolved or the pool could not be computed. */
  known: boolean;
}

const UNKNOWN: LegalItems = { items: [], known: false };

/**
 * Mod entries commonly inherit an item whose base Dex row is absent from the
 * installed package. In that case @pkmn/dex exposes the ID as a lower-case
 * name. Keep the ID for validation, but give every picker a readable label;
 * future regulations get this automatically without another item allowlist.
 */
export function displayItemName(item: { id: string; name: string }): string {
  if (item.name && item.name !== item.id) return item.name;
  if (!item.id) return item.name;
  return item.id[0].toUpperCase() + item.id.slice(1);
}

/**
 * The validator only reads `name` while checking an item. Keeping this probe
 * deliberately small means item-pool generation does not accidentally acquire
 * species, move, or team-level legality semantics.
 */
function probeSet(itemName: string): PokemonSet {
  return { name: 'Item probe', item: itemName } as PokemonSet;
}

/**
 * Return the items accepted by the selected simulator format.
 *
 * This intentionally does not filter on `num`: Showdown mod entries for new
 * items can have `num: 0` while still being real, legal items. `checkItem`
 * applies the format's explicit bans, `nonexistent` tags, and mod-specific
 * exceptions in the same order as full team validation.
 */
export function legalItemsFor(formatId: string): LegalItems {
  registerBattleMods();

  try {
    // Resolve the format on the base Dex. Custom format registrations live in
    // this ruleset cache; asking a modded Dex for the format can produce an
    // exists:false Condition instead of the actual Format.
    const format = Dex.formats.get(formatId);
    if (!format?.exists || format.effectType !== 'Format') return UNKNOWN;

    const validator = new TeamValidator(format);
    const items: ItemPickerData[] = [];

    for (const item of validator.dex.items.all()) {
      if (!item.exists || !item.id) continue;

      // checkItem is public in @pkmn/sim and is the same gate used by
      // validateTeam. A fresh setHas object prevents one candidate from
      // influencing the next candidate through the rule table.
      if (validator.checkItem(probeSet(item.name), item, {}) !== null) continue;

      items.push({
        id: item.id,
        name: displayItemName(item),
        shortDesc: item.shortDesc || item.desc,
      });
    }

    items.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    return { items, known: true };
  } catch {
    return UNKNOWN;
  }
}
