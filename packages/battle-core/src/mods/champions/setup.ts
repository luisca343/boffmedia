/**
 * The single place the Champions mods and formats get registered.
 *
 * There used to be two: `mods/register.ts` (battle-core's general entry point)
 * and `mods/champions/registry.ts` (`initChampionsMod`, which apps/api's VGC
 * meta service calls). Both did `Dex.mod(...)` + `Dex.formats.extend(...)`, and
 * `DexFormats.extend()` throws `Format #N has a duplicate ID` the second time —
 * so a process that happened to call both crashed. They now both funnel here,
 * which also means the Stat Point cap applies no matter which door you came in
 * through.
 */

import { Dex } from '@pkmn/sim';

import { CHAMPIONS_FORMATS, CHAMPIONS_MODS } from './registry.generated.js';
import { CHAMPIONS_SP_FORMAT_RULES, CHAMPIONS_SP_RULESET } from './sp.js';

let registered = false;

export function registerChampionsMods(): void {
  if (registered) return;

  // Parents-first: a mod whose Scripts declare `inherit` resolves its parent
  // through the sim's dex registry at load time, so registering a child before
  // its parent throws. `CHAMPIONS_MODS` is already in that order.
  //
  // The data objects are cloned before they are handed over: `Dex.loadData()`
  // MUTATES a mod's tables in place when it copies inherited entries down from
  // the parent, and `registry.generated.ts` is a generated module shared by the
  // whole process. Cloning also lets us bolt the SP rule onto `champions`'
  // Rulesets without editing the generated table.
  for (const { id, data } of CHAMPIONS_MODS) {
    const clone: Record<string, unknown> = { ...data };
    if (id === 'champions') {
      clone.Rulesets = {
        ...((data.Rulesets ?? {}) as Record<string, unknown>),
        ...(CHAMPIONS_SP_RULESET as unknown as Record<string, unknown>),
      };
    }
    Dex.mod(id, clone as never);
  }

  // Extend the BASE Dex format list. Every ModdedDex carries its OWN format
  // cache, so a format registered on a modded dex is invisible to the base one
  // and vice versa — see the comment in `teams/validate.ts`.
  //
  // `CHAMPIONS_FORMATS` is `as const`, so each entry (and its `ruleset`) is
  // cloned before the SP rules are appended.
  Dex.formats.extend(
    CHAMPIONS_FORMATS.map((format) => ({
      ...format,
      ruleset: [...format.ruleset, ...CHAMPIONS_SP_FORMAT_RULES],
    })) as never[],
  );

  registered = true;
}

export function championsModsRegistered(): boolean {
  return registered;
}
