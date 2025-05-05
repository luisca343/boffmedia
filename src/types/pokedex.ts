import { Evolution } from "./Pokemon"


export type Registry = {
    pokemonId: number
    formId: string
    paletteId: string
    caughtAt: string
    seenAt: string
}

export type PokedexData = {
    seenPokemon: string[]
    caughtPokemon: string[]
    shinyPokemon: string[]
    totalPokemon: number
    seenCount: number
    caughtCount: number
    shinyCount: number
    missingSeenPokemon: number
    missingCaughtPokemon: number
    missingSeenForms: number
    missingCaughtForms: number
}

export type PokemonMove = {
    name: string
    type: string
    category: string
    power: number
    pp: number
    accuracy: number
}


  
 export type PokemonEvo = {
    pkm: string;
    evos: {
      [key: string]: PokemonEvo;
    };
    dex: number;
    index: number | null;
    methods?: Evolution[];
    spriteUrl: string;
  };

  export type SubTree = {
    [key: string]: PokemonEvo;
  }
  
  export type EvolutionTree = {
    depth: number;
    tree: SubTree;
  };