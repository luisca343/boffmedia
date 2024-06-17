import {PRNG, PRNGSeed, Teams} from '@pkmn/sim';
import {TeamGenerators} from '@pkmn/randoms';
import { PokemonSet } from '@pkmn/data';

export interface PlayerOptions {
    name?: string;
    avatar?: string;
    rating?: number;
    team?: PokemonSet[] | string | null;
    seed?: PRNGSeed;
}

export function getRandomTeam(){
    Teams.setGeneratorFactory(TeamGenerators);
    const prng = new PRNG();
    
    const options = {
        seed: prng.seed,
    }
    
    const team = Teams.generate('gen9randombattle', options);
    return team as PokemonSet<string>[];
}