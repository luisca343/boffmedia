/**
 * Defensive type coverage for a team: for every attacking type, how many
 * members take more, less or no damage from it.
 *
 * Deliberately the simple count — not a weighted score, not offensive
 * coverage — because it is the table a builder actually scans ("three of us
 * are weak to Ground") and because anything cleverer would need the moves,
 * the items and the abilities to be right, and this panel has to stay honest
 * with an incomplete team.
 */

import { Dex } from "@pkmn/dex";
import type { PokemonSet } from "@pkmn/sim";
import { effectiveness } from "@boffmedia/pokemon-identity";

import { TYPE_LIST } from "./labels";

export interface CoverageRow {
  type: string;
  weak: number;
  resist: number;
  immune: number;
  /** Which slots (0-5) are weak to this type — the tooltip's payload. */
  weakSlots: number[];
}

export function analyseTeam(sets: PokemonSet[]): { rows: CoverageRow[]; members: number } {
  const members = sets
    .map((set, slot) => ({ slot, species: set.species ? Dex.species.get(set.species) : null }))
    .filter((m): m is { slot: number; species: NonNullable<typeof m.species> } => Boolean(m.species?.exists));

  const rows = TYPE_LIST.map((attack) => {
    const row: CoverageRow = { type: attack, weak: 0, resist: 0, immune: 0, weakSlots: [] };
    for (const { slot, species } of members) {
      const mult = effectiveness(attack, species.types);
      if (mult === 0) row.immune += 1;
      else if (mult > 1) {
        row.weak += 1;
        row.weakSlots.push(slot);
      } else if (mult < 1) row.resist += 1;
    }
    return row;
  });

  return { rows, members: members.length };
}
