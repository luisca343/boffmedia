import { Dex } from '@pkmn/sim';

import { initChampionsMod } from '../../champions.mod';

/**
 * Returns a format-aware Dex instance for the given formatId.
 *
 * Ensures the Champions mod is initialized before any format lookup so that
 * Champions-only forms (e.g. mega evolutions in vgc2026regma) resolve with
 * correct baseStats and types.
 *
 * Falls back to the global Dex if `formatId` is undefined or the format does
 * not exist in the registry.
 */
export function getDexForFormat(formatId?: string): typeof Dex {
  initChampionsMod();
  if (!formatId) return Dex;
  const format = Dex.formats.get(formatId);
  return format.exists ? Dex.forFormat(format) : Dex;
}

/**
 * Resolves a canonical Showdown species ID from a display name using the
 * provided Dex context.
 *
 * Prefers the Dex-confirmed `.id` so that formes like "Rotom-Wash" →
 * `"rotomwash"` are handled consistently. Falls back to a plain slug if the
 * species is not found in the Dex.
 */
export function resolveSpeciesId(name: string, dex: typeof Dex): string {
  const s = dex.species.get(name);
  return s.exists ? s.id : name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Maps mega-evolution and primal-reversion species IDs back to their base
 * species ID so that cross-format comparisons (e.g. standard VGC ladder vs
 * Champions tournament) can join on a consistent key.
 *
 * Regional/alternate formes (Rotom-Wash, Landorus-Therian, …) are intentionally
 * left unchanged because they are distinct competitive identities.
 */
export function toBaseFormId(speciesId: string, dex: typeof Dex): string {
  const s = dex.species.get(speciesId);
  if (!s.exists) return speciesId;
  const f = s.forme;
  if (
    f === 'Mega' ||
    f === 'Mega-X' ||
    f === 'Mega-Y' ||
    f === 'Primal' ||
    f === 'Eternal'
  ) {
    const base = dex.species.get(s.baseSpecies);
    return base.exists ? base.id : speciesId;
  }
  return speciesId;
}
