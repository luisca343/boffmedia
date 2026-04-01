import { PokemonW } from "@boffmedia/shared";

export type ExtendedPokemonW = PokemonW & {
  hp?: number;
  status?: string;
  gender?: string;
  types?: string[];
};

export interface PCPokemon {
  pokemon: ExtendedPokemonW;
  index: number;
  box: number;
}

export interface PCBoxData {
  boxNumber: number;
  pokemon: (PCPokemon | null)[];
}

export interface PCData {
  boxes: PCBoxData[];
  currentBox: number;
  totalBoxes: number;
}
