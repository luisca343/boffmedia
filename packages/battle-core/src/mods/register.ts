/**
 * Battle mod registration for @pkmn/sim.
 *
 * Registers both the Champions and Teras mods. Idempotent via a module-level flag.
 * Parents are registered first.
 */

import { Dex } from '@pkmn/sim';
import * as TerasModData from './teras/index.js';
import { registerChampionsMods } from './champions/setup.js';

let initialized = false;

export function registerBattleMods(): void {
  if (initialized) return;

  // Champions mods + formats (including the Stat Point cap). Shared with
  // `initChampionsMod()` so the two entry points cannot register twice.
  registerChampionsMods();

  // Register the Teras mod
  // Scripts declare `inherit: 'gen9'`, so the dex registry will resolve the parent
  const terasData = {
    Abilities: TerasModData.Abilities,
    FormatsData: TerasModData.FormatsData,
    Items: TerasModData.Items,
    Learnsets: TerasModData.Learnsets,
    Moves: TerasModData.Moves,
    Species: TerasModData.Species,
    Scripts: TerasModData.Scripts,
  };

  Dex.mod('teras', terasData as never);

  // Extend the BASE Dex format list so Dex.formats.get() works globally.
  // Each ModdedDex carries its own format cache, so this must target the base Dex.
  Dex.formats.extend([
    {
      name: '[Gen 9] Teras',
      mod: 'teras',
      team: undefined,
      // Just 'Standard'. The list this replaced could not resolve AT ALL:
      // 'Munchies Clause' does not exist in @pkmn/sim (or in the teras mod), so
      // `getRuleTable` threw `Unrecognized rule "Munchies Clause"` — and even
      // without it, 'Species Clause', 'OHKO Clause' and 'Evasion Moves Clause'
      // are already inside 'Standard', which throws `already exists`. The
      // format was unusable; nothing noticed because nothing resolved its rule
      // table until team validation was fixed.
      ruleset: ['Standard'],
      banlist: [],
    },
    // TODO: '[Gen 9] Teras Random Battle' requires a custom random team generator (M4)
  ] as never[]);

  initialized = true;
}

/**
 * Safe to call multiple times; returns immediately if already initialized.
 * Register mods before creating battles or teambuilders.
 */
export function isRegistered(): boolean {
  return initialized;
}
