export interface PCPokemon {
  pokemon: {
    dex: number;
    nature: string;
    species: string;
    form: string;
    palette: string;
    name: string;
    level: number;
    item: string;
    ability: string;
    moves: (string | null)[];
    ivs: number[];
    evs: number[];
    stats: number[];
    gender?: string;
    types?: string[];
  };
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
