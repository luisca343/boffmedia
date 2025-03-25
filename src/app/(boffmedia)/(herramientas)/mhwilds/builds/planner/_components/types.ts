export type EquipmentType = 'weapon' | 'secondaryWeapon' | 'head' | 'chest' | 'arms' | 'waist' | 'legs' | 'charm';

export interface SkillInfo {
  id: number;
  gameId: number;
  name: string;
  kind: string;
}

export interface SkillRank {
  skill: SkillInfo;
  level: number;
  description: string;
  id: number;
  name?: string; // Adding optional name for compatibility
}

export interface Item {
  id: number;
  gameId: number;
  rarity: number;
  name: string;
  description: string;
  value: number;
  carryLimit: number;
  recipes: any[]; // Could be more specific if we have recipe details
}

export interface CraftingMaterial {
  item: Item;
  quantity: number;
  id: number;
}

export interface Crafting {
  armor: {
    id: number;
  };
  materials: CraftingMaterial[];
  zennyCost: number;
  id: number;
}

export interface ElementData {
  type: string;
  damage: number;
}

export interface DefenseData {
  base: number;
  max?: number;
  augmented?: number;
}

export interface ArmorPiece {
  id: string | number;
  name: string;
  description?: string;
  kind: string;
  rank: string;
  rarity: number;
  defense: DefenseData | number;
  resistances: {
    fire: number;
    water: number;
    thunder: number;
    ice: number;
    dragon: number;
  };
  slots: number[];
  skills: SkillRank[];
  armorSet?: {
    id: string | number;
    name: string | null;
    pieces?: number;
    bonus?: string | null;
  };
  crafting?: Crafting;
  imageUrl?: string;
}

export interface DecorationSkill {
  skill: {
    id: number | string;
    name: string;
  };
  level: number;
  description: string;
  id: number | string;
}

export interface Decoration {
  id: number | string;
  gameId?: number;
  name: string;
  description?: string;
  slot: number; // "slot" instead of "size"
  rarity: number;
  kind?: string;
  skills: DecorationSkill[];
  value?: number;
}

export interface DecorationAssignment {
  equipmentType: EquipmentType;
  slotIndex: number;
  slotSize: number;
  decoration: Decoration;
}

export interface WeaponDamage {
  display: number;
  raw: number;
}

export interface WeaponSpecial {
  type?: string;
  element?: string;
  status?: string;
  kind?: string;
  damage?: number | WeaponDamage;
  value?: number;
  hidden?: boolean;
  weapon?: {
    id: number | string;
  };
}

export interface Sharpness {
  red: number;
  orange: number;
  yellow: number;
  green: number;
  blue: number;
  white: number;
  purple: number;
}

export type Elderseal = "low" | "average" | "high" | null;

export interface WeaponCrafting {
  craftable: boolean;
  materials: {
    item: {
      id: number;
      name: string;
    };
    quantity: number;
  }[];
}

export interface Weapon {
  id: number | string;
  gameId?: number;
  kind: string;
  name: string;
  type?: string; // For backward compatibility
  rarity: number;
  damage: WeaponDamage;
  specials?: WeaponSpecial[];
  element?: ElementData;
  sharpness?: Sharpness;
  handicraft?: number[];
  skills?: SkillRank[];
  defenseBonus?: number;
  elderseal?: Elderseal;
  affinity: number;
  slots: number[];
  defense?: number | DefenseData; // For backward compatibility
  attack?: number; // For backward compatibility
  crafting?: WeaponCrafting;
  imageUrl?: string;

  description?: string;
}

export interface Skill {
  id: string | number;
  name: string;
  level: number;
  maxLevel: number;
  description?: string;
  kind?: string;
}

export interface BuildData {
  name: string;
  weapon: Weapon | null;
  secondaryWeapon: Weapon | null;
  head: ArmorPiece | null;
  chest: ArmorPiece | null;
  arms: ArmorPiece | null;
  waist: ArmorPiece | null;
  legs: ArmorPiece | null;
  charm: Charm | null;
  decorations: DecorationAssignment[];
}

export interface BuildDataWithIds {
  name: string;
  weaponId: string | null;
  secondaryWeaponId: string | null;
  headId: string | null;
  chestId: string | null;
  armsId: string | null;
  waistId: string | null;
  legsId: string | null;
  charmId: string | null;
  decorations: {
    equipmentType: EquipmentType;
    slotIndex: number;
    slotSize: number;
    decorationId: string;
  }[];
}

export interface Filters {
  search: string;
  rarity: number[];
  skills: string[];
  slots: number[];
  element?: string;
}
export interface StatsData {
  weapon: Weapon | null;
  defense: number;
  fireRes: number;
  waterRes: number;
  thunderRes: number;
  iceRes: number;
  dragonRes: number;
  attack: number;
  affinity: number;
  element?: {
    type: string;
    damage: number;
  };
  status?: {
    type: string;
    damage: number;
    hidden?: boolean;
  };
  sharpness: {
    red: number;
    orange: number;
    yellow: number;
    green: number;
    blue: number;
    white: number;
    purple: number;
  };
}

export interface CharmSkill {
  skill: {
    id: number;
    name: string;
  };
  level: number;
  description: string;
  id: number;

  name?: null;
}

export interface CharmMaterial {
  item: {
    id: number;
    gameId: number;
    rarity: number;
    name: string;
    description: string;
    value: number;
    carryLimit: number;
    recipes: any[];
  };
  quantity: number;
  id: number;
}

export interface CharmCrafting {
  charmRank: {
    id: number;
  };
  craftable: boolean;
  materials: CharmMaterial[];
  zennyCost: number;
  id: number;
}

export interface Charm {
  id: number;
  charm: {
    id: number;
    gameId: number;
  };
  name: string;
  description: string;
  level: number;
  rarity: number;
  skills: CharmSkill[];
  crafting?: CharmCrafting;
  slots: number[];
}

// Generic EquipmentComponent interface to represent any armor piece or weapon
export type EquipmentComponent = ArmorPiece | Weapon | Charm