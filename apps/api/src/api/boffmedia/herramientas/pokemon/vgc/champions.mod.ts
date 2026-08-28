/**
 * Champions mod registration for @pkmn/sim.
 *
 * The data tables and the format list are generated from the official Pokémon
 * Showdown source — see `mod/registry.generated.ts` for the upstream commit they
 * came from, and `mod/.source.json` for the full provenance record.
 *
 * To add a regulation (from apps/api/):
 *   pnpm add-regulation "[Gen 9 Champions] VGC 2026 Reg M-B"
 *
 * Nothing here is hand-maintained: the generator re-resolves every tracked
 * format against upstream, because a format's `mod` moves between regulations.
 * Reg M-A started on `champions` and was rehomed to `championsregma` when Reg
 * M-B inherited the `champions` name, so a hand-written list silently rots.
 */
import { Dex } from '@pkmn/sim';

import { CHAMPIONS_FORMATS, CHAMPIONS_MODS } from './mod/registry.generated';

let initialized = false;

export function initChampionsMod(): void {
  if (initialized) return;

  // CHAMPIONS_MODS is ordered parents-first. A mod whose Scripts declare
  // `inherit` resolves its parent through the sim's dex registry at load time,
  // so registering a child before its parent throws.
  for (const { id, data } of CHAMPIONS_MODS) {
    Dex.mod(id, data as never);
  }

  // Extend the BASE Dex format list so Dex.formats.get('gen9championsvgc2026regmb')
  // and friends work globally across the app. Each ModdedDex carries its own
  // format cache, so this has to target the base Dex specifically.
  Dex.formats.extend([...CHAMPIONS_FORMATS] as never[]);

  initialized = true;
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
