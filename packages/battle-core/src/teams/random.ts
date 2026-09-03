/**
 * Random team generation for @pkmn/randoms.
 *
 * Lifted from apps/api/_utils/teams.ts.
 */

import { TeamGenerators } from '@pkmn/randoms';
import type { PokemonSet } from '@pkmn/sim';

export function getRandomTeam(format: string = 'gen9randombattle'): PokemonSet[] {
  const generator = TeamGenerators.getTeamGenerator(format);
  return generator.getTeam() as PokemonSet[];
}
