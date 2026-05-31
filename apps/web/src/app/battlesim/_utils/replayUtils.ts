import { PokemonIdent } from "@pkmn/protocol";

/**
 * Translates a PokemonIdent to be relative to the current POV.
 * When POV is 1, swaps p1↔p2 identifiers.
 */
export function getRelativeIdent(pokemonIdent: PokemonIdent, pov: 0 | 1): PokemonIdent {
  const identCode = pokemonIdent.split(':')[0];
  if (pov === 0) return identCode as PokemonIdent;
  return identCode.includes('1') 
    ? identCode.replace('1', '2') as PokemonIdent 
    : identCode.replace('2', '1') as PokemonIdent;
}

/**
 * Extracts a display name from a participant name string.
 * Handles "player:uuid:name" and "npc:name" formats.
 */
export function getParticipantName(name: string): string {
  if (!name) return 'Unknown';
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
