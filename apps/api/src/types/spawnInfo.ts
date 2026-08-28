export interface HeldItem {
  itemID: string;
  percentChance: number;
}

export interface Condition {
  times: string[];
  /** Pixelmon 9.4.0+. Tag references (`#pixelmon:spawning/mesas`) or literal ids. */
  biomes?: string[];
  /** Pixelmon 1.16.5 and the live overlay. Still present on 2 spawnInfos in 9.4.0. */
  stringBiomes?: string[];
}

export interface SpawnInfo {
  spec: string;
  stringLocationTypes: string[];
  minLevel: number;
  maxLevel: number;
  typeID: string;
  heldItems: HeldItem[];
  condition: Condition;
  rarity: number;

  spawnType: string;
  pokemonName: string;
  pokemonForm: string;
  pokemonPalette: string;
  pokemonDex: number;
  gender: string;
}

export interface Pokemon {
  id: string;
  spawnInfos: SpawnInfo[];
}

export interface SpawnInfos {
  id: string;
  spawnInfos: SpawnInfo[];
}
