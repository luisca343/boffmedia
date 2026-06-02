import { TeamGenerators } from '@pkmn/randoms';
import { PokemonSet } from '@pkmn/data';

export function getRandomTeam(format: string = 'gen9randombattle') {
  const generator = TeamGenerators.getTeamGenerator(format);
  return generator.getTeam() as PokemonSet<string>[];
}
