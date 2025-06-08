export interface ShowdownPokemon {
    num: number;
    name: string;
    baseSpecies?: string;
    forme?: string;
    types: string[];
    gender?: string;
    baseStats: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
    };
    abilities: { [key: string]: string };
    heightm?: number;
    weightkg: number;
    prevo?: string;
    evoLevel?: number;
    evoType?: string;
    evoCondition?: string;
    evos?: string[];
    eggGroups: string[];
  }
  
  export interface ShowdownPokemonData {
    [key: string]: ShowdownPokemon;
  }