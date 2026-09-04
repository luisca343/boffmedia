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

/**
 * Why a pasted transcript cannot be played, or `null` when it can.
 *
 * `"markers"` is deliberately the only structural verdict: this is a cheap
 * smell test in front of the loader, NOT a protocol parser. `BattleStateBuilder`
 * feeds every line to `@pkmn/client`, which throws on the first line it cannot
 * make sense of — and a throw there lands in the player, past the point where
 * the paste box can still say anything useful.
 */
export type ReplayTranscriptProblem = 'empty' | 'markers';

/**
 * The three markers the replay player cannot do without.
 *
 * `|player|` names the sides the shell renders, `|start` is where
 * `buildSetupState()` stops feeding setup lines, and `|turn|` is what the turn
 * index is built from — a transcript with no `|turn|` line has no timeline to
 * scrub and `lastTurn` resolves to nothing.
 *
 * NOTE THE MISSING TRAILING PIPE ON `|start`: the protocol line is a bare
 * `|start`, so a check for `'|start|'` matches nothing at all — the loader's
 * first version had exactly that and the marker was silently never enforced.
 */
export function validateReplayTranscript(text: string): ReplayTranscriptProblem | null {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';

  const hasPlayer = trimmed.includes('|player|');
  const hasStart = /^\|start\b/m.test(trimmed);
  const hasTurn = trimmed.includes('|turn|');

  return hasPlayer && hasStart && hasTurn ? null : 'markers';
}
