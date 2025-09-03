import { PokemonW } from "@/generated/api";

export interface PCPokemon {
  pokemon: PokemonW;
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
