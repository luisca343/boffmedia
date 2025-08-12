export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonData {
  pokemonName: string;
  types?: string[];
  stats?: PokemonStats;
  moves?: Record<string, any>;
  habitat?: string[];
  id?: number;
  form?: string;
}
