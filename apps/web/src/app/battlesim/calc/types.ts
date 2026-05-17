import { AbilityName, GenderName, StatusName, TypeName } from "@smogon/calc/dist/data/interface";

interface SpeciesAbility<A = string> { 0: A; 1?: A; H?: A; S?: A }

// Pokemon data structure
export interface PokemonData {
  id: string;
  name: string;
  num: number;
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  abilities?: SpeciesAbility<string | AbilityName>
}

// Stats interfaces
export interface StatsTable {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface BoostsTable {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

// Pokemon state
export interface PokemonState {
  pokemonId: string;
  moveIds: string[];
  nature: string;
  evs: StatsTable;
  ivs: StatsTable;
  boosts: BoostsTable;
  level: number;
  teraType: TypeName;
  isTerastallized: boolean;
  gender: GenderName;
  ability: string;
  item: string;
  status: StatusName;
  currentHp: number;
  currentHpPercent: number;
}

// Move data
export interface MoveData {
  id: string;
  name: string;
  type: string;
  basePower: number;
  category: string;
}

// Item data
export interface ItemData {
  id: string;
  name: string;
}

// Ability data
export interface AbilityData {
  id: string;
  name: string;
}

// Damage calculation result
export interface DamageResult {
  attacker: any;
  defender: any;
  move: any;
  damage: number | number[] | [number[], number[]];
  rawDesc: any;
  koChance: any;
  damageRange: any;
  description: string;
  direction: string;
  originalResult: any;
}