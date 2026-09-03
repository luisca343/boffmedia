/**
 * Showdown paste format import/export + pack/unpack.
 *
 * Wraps @pkmn/sim's Teams module to handle Showdown paste format.
 * Returns null on malformed input rather than throwing.
 */

import { Teams, type PokemonSet } from '@pkmn/sim';

export function importPaste(text: string): PokemonSet[] | null {
  if (!text || typeof text !== 'string') return null;
  try {
    return Teams.import(text);
  } catch {
    return null;
  }
}

export function exportPaste(team: PokemonSet[]): string {
  if (!team || !Array.isArray(team)) return '';
  try {
    return Teams.export(team);
  } catch {
    return '';
  }
}

export function packTeam(team: PokemonSet[]): string {
  if (!team || !Array.isArray(team)) return '';
  try {
    return Teams.pack(team);
  } catch {
    return '';
  }
}

export function unpackTeam(packed: string): PokemonSet[] | null {
  if (!packed || typeof packed !== 'string') return null;
  try {
    return Teams.unpack(packed);
  } catch {
    return null;
  }
}
