export interface HeldItem {
  itemID: string;
  percentChance: number;
}

export interface Condition {
  times: string[];
  stringBiomes: string[];
  maxY?: number;
  minY?: number;
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

  spriteUrl: string;
}

export interface Pokemon {
  id: string;
  spawnInfos: SpawnInfo[];
}

export interface SpawnInfos {
  id: string;
  spawnInfos: SpawnInfo[];
}