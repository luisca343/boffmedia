import { index } from "drizzle-orm/mysql-core";

export interface Pokemon {
    dex: number;
    name: string;
    forms: PokemonForm[];
    generation: number;
    spriteUrl?: string;
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
    
    spriteUrl?: string;
    paletteSprites?: Record<string, string>;
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
    // Add other evolution properties as needed
  }
  
  export interface BattleStats {
    // Add battle stats properties
  }
  
  export interface SpawnInfo {
    typeID: string;
    spec: string;
    condition?: {
      stringBiomes?: string[];
    };
    spawnType?: string;
    pokemonName?: string;
    pokemonForm?: string;
    pokemonPalette?: string;
    gender?: string;
    pokemonDex?: number;
    rarity?: number;
    spriteUrl?: string;
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
    spriteUrl?: string;
  }
  
  