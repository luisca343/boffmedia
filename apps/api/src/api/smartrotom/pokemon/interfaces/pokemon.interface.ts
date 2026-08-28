export interface Pokemon {
  dex: number;
  name: string;
  defaultForms: string[];
  forms: PokemonForm[];
  generation: number;

  isCustom: boolean;
}

export interface PokemonForm {
  index: number;
  name?: string;
  types: string[];
  dimensions?: {
    height: number;
    width: number;
    length: number;
  };
  weight?: number;
  abilities?: {
    abilities: string[];
    hiddenAbilities?: string[];
  };
  moves?: {
    [key: string]: (string | { attacks: string[] })[];
  };
  genderProperties?: GenderProperties[];
  evolutions?: Evolution[];
  preEvolutions?: string[];
  battleStats?: BattleStats;
  eggGroups?: string[];
  gender?: string;
}

export interface GenderProperties {
  palettes: Palette[];
}

export interface Palette {
  name: string;
  texture: string;
  sprite?: string;
}

export interface Evolution {
  to: string;
  evoType: string; // Add this required field
  conditions?: any[];
  item?: { itemID: string };
  moves?: string[];
}

export interface BattleStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface SpawnInfo {
  typeID: string;
  spec: string;
  condition?: {
    /** Pixelmon 9.4.0+. Tag references (`#pixelmon:spawning/mesas`) or literal ids. */
    biomes?: string[];
    /** Pixelmon 1.16.5 and the live overlay. Still present on 2 spawnInfos in 9.4.0. */
    stringBiomes?: string[];
  };
  spawnType?: string;
  pokemonName?: string;
  pokemonForm?: string;
  pokemonPalette?: string;
  gender?: string;
  pokemonDex?: number;
  rarity?: number;
}

export interface SpawnInfos {
  spawnInfos: SpawnInfo[];
}

export interface Attack {
  attackName: string;
  attackType: string;
  attackCategory: string;
  basePower: number;
  ppBase: number;
  ppMax: number;
  accuracy: number;
}

export interface SpeciesMoveEntry {
  speciesID: number;
  form: string;
  speciesName?: string;
}
