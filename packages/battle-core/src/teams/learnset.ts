/**
 * "What can this species legally run in this format?"
 *
 * The teambuilder's move picker needs this, and the one thing it must not do is
 * reimplement legality: prevo chains, formes, gen rules, event-only moves and a
 * modded dex's own learnset table are exactly where a hand-rolled version goes
 * quietly wrong. So this asks the sim the same way `TeamValidator` does —
 * `dex.species.getMovePool(id)` — and then subtracts whatever the format's rule
 * table bans.
 */

import { Dex } from '@pkmn/sim';

import { registerBattleMods } from '../mods/register.js';

export interface LegalMoves {
  /** Move ids (e.g. `protect`, `knockoff`), sorted. */
  moves: string[];
  /**
   * `false` = could not determine — unknown format, unknown species, or a
   * lookup that threw. Callers must fall back to showing everything rather
   * than presenting an empty pool as "this Pokémon has no legal moves".
   */
  known: boolean;
}

const UNKNOWN: LegalMoves = { moves: [], known: false };

export function legalMovesFor(formatId: string, speciesName: string): LegalMoves {
  registerBattleMods();

  try {
    // Base Dex for the format lookup — the per-dex `rulesetCache` means a
    // modded dex has never heard of our custom formats. See `validate.ts`.
    const fmt = Dex.formats.get(formatId);
    if (!fmt?.exists || fmt.effectType !== 'Format') return UNKNOWN;

    const dex = Dex.forFormat(fmt);
    const species = dex.species.get(speciesName);
    if (!species?.exists) return UNKNOWN;

    const pool = dex.species.getMovePool(species.id);
    if (!pool) return UNKNOWN;

    let ruleTable: { isBanned(thing: string): boolean } | null = null;
    try {
      ruleTable = dex.formats.getRuleTable(fmt);
    } catch {
      // A format whose rule table does not resolve still has a usable move
      // pool; better an unfiltered list than none.
      ruleTable = null;
    }

    const moves: string[] = [];
    for (const id of pool) {
      if (ruleTable?.isBanned(`move:${id}`)) continue;
      moves.push(id);
    }
    moves.sort();

    return { moves, known: true };
  } catch {
    return UNKNOWN;
  }
}
