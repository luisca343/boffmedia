import { PokemonIdent } from "@pkmn/protocol";

/**
 * Translates a PokemonIdent to the slot code the VIEWER sees.
 *
 * Only the side prefix is swapped. It used to be a bare
 * `replace('1', '2')` over the whole string, which rewrites the first '1'
 * anywhere it appears — a slot code is `p1a`, but the ident it is sliced from
 * is not always, and the rule silently produced a code no element carries.
 */
export function getRelativeIdent(pokemonIdent: PokemonIdent, pov: 0 | 1): PokemonIdent {
  const identCode = String(pokemonIdent).split(':')[0];
  if (pov === 0) return identCode as PokemonIdent;
  const side = identCode.slice(0, 2);
  if (side === 'p1') return ('p2' + identCode.slice(2)) as PokemonIdent;
  if (side === 'p2') return ('p1' + identCode.slice(2)) as PokemonIdent;
  return identCode as PokemonIdent;
}

/**
 * Extracts a display name from a participant name string.
 * Handles "player:uuid:name" and "npc:name" formats.
 */
export function getParticipantName(name: string): string {
  if (!name) return 'Unknown';
  name = name.trim();
  if (name.includes('player:')) {
    return name.split(':')[2] || name;
  }
  if (name.includes('npc:')) {
    return name.split(':')[1] || name;
  }
  return name;
}

/**
 * Counts the number of lines in a battle log string.
 */
export function countActions(battleLog: string | null): number {
  return battleLog ? battleLog.split('\n').length : 0;
}
