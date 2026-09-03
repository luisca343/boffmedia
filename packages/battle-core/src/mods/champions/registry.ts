/**
 * Champions mod initialization functions.
 *
 * The data tables and format list are generated from the official Pokémon
 * Showdown source — see `registry.generated.ts` for the upstream commit they
 * came from, and `.source.json` for the full provenance record.
 *
 * These functions are exported from @boffmedia/battle-core and re-imported by
 * apps/api for backward compatibility.
 */
import { CHAMPIONS_FORMATS } from './registry.generated.js';
import { registerChampionsMods } from './setup.js';

/**
 * Register the Champions mods and formats on the base Dex.
 *
 * Thin alias for `registerChampionsMods()` (see `./setup.ts`) kept for the
 * apps/api call sites that already import it. Both are idempotent and share one
 * flag, so calling this and `registerBattleMods()` in the same process is safe.
 */
export function initChampionsMod(): void {
  registerChampionsMods();
}

/**
 * The format ids this mod registers, e.g. 'gen9championsvgc2026regmb'.
 *
 * Used to tell an admin which values `formatId` may take when registering a
 * regulation — the sim derives the id by lowercasing the name and stripping
 * everything that is not alphanumeric.
 */
export function listChampionsFormatIds(): string[] {
  return CHAMPIONS_FORMATS.map((f) =>
    f.name.toLowerCase().replace(/[^a-z0-9]+/g, ''),
  );
}
