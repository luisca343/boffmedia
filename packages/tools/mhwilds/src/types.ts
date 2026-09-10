export type EquipmentType =
  | "weapon"
  | "secondaryWeapon"
  | "head"
  | "chest"
  | "arms"
  | "waist"
  | "legs"
  | "charm";

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
  defense: DefenseData;
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

export interface DecorationIcon {
  color?: string;
  colorId?: number;
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
  icon?: DecorationIcon;
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
    decorationId: string;
  }[];
}

export interface Filters {
  search: string;
  rarity: number[];
  skills: string[];
  slots: number[];
  element?: string;
  weaponType?: string;
}
export interface StatsData {
  weapon: Weapon | null;
  defenseMin: number;
  defenseMax: number;
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

  name?: string | null;
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
export type EquipmentComponent = ArmorPiece | Weapon | Charm;
// ── Bestiary / monsters (wilds.mhdb.io/{locale}/monsters via the API proxy) ──
export interface MhMonsterSize {
  base: number;
  mini: number;
  silver: number;
  gold: number;
}
export interface MhMonsterWeakness {
  kind: "element" | "status" | "effect" | string;
  element?: string;
  status?: string;
  effect?: string;
  level?: number | null;
  condition?: string | null;
  id: number;
}
export interface MhMonsterResistance {
  kind: "element" | "status" | "effect" | string;
  element?: string;
  status?: string;
  effect?: string;
  condition?: string | null;
  id: number;
}
export interface MhMonsterLocation {
  id: number;
  name: string;
  zoneCount?: number;
}
export interface MhRewardCondition {
  kind: string;
  rank?: string | null;
  quantity?: number;
  chance?: number;
  part?: string | null;
  id: number;
}
export interface MhMonsterReward {
  id: number;
  item: Item & {
    icon?: {
      id?: number;
      kind?: string;
      color?: string;
      colorId?: number;
    };
  };
  conditions: MhRewardCondition[];
}

export type MhLocalizedText = Record<string, string> | null;

export interface MhWildsAssetFile {
  raw?: string;
  dds?: string;
  png?: string;
}

export interface MhWildsPartTypeInfo {
  index: number;
  iconType: number;
  nameGuid: string;
  name: MhLocalizedText;
  rottenName?: MhLocalizedText;
  description?: MhLocalizedText;
}

export interface MhWildsHitzone {
  slash?: number | null;
  blunt?: number | null;
  shot?: number | null;
  fire?: number | null;
  water?: number | null;
  thunder?: number | null;
  ice?: number | null;
  dragon?: number | null;
  stun?: number | null;
  lightPlant?: number | null;
}

export interface MhWildsBreakData {
  id: string;
  executeCount?: number | null;
  maxCount?: number | null;
  condition?: number | null;
  partType?: number | null;
  targetPartGuids?: string[];
}

export interface MhWildsPartData {
  index: number;
  id: string;
  type: number;
  typeInfo: MhWildsPartTypeInfo;
  health?: number | null;
  healthStages?: number[];
  hasHealth?: boolean;
  kinsectExtract?: number | null;
  hitzone?: MhWildsHitzone | null;
  breakHitzone?: MhWildsHitzone | null;
  breaks: MhWildsBreakData[];
  breakRewards: unknown[];
}

export interface MhWildsAnatomyCallout {
  anchor: { x: number; y: number };
  target: { x: number; y: number };
}

/** Runtime correction saved by the Boffmedia admin anatomy editor. */
export interface MhWildsAnatomyOverride {
  fixedId: number;
  variantId: string;
  callouts: Array<{
    slotKey: string;
    target: { x: number; y: number };
  }>;
  updatedAt?: string;
}

export interface MhWildsAnatomySlot {
  key: string;
  visible: boolean;
  partType: number;
  part?: { name: MhLocalizedText } | null;
  breakType?: number | null;
  break?: { name: MhLocalizedText } | null;
  arrow?: {
    size: number | null;
    rotation: number | null;
    visible: boolean;
  };
  /** Normalized game-report endpoint, adjusted to the anatomy PNG when available. */
  callout?: MhWildsAnatomyCallout | null;
}

export interface MhWildsGameElementWeakness {
  element: string;
  level: number;
}

export interface MhWildsMonsterVariant {
  id: string;
  identity?: {
    enumName?: string;
    fixedId?: number;
    names?: MhLocalizedText;
    descriptions?: MhLocalizedText;
  } | null;
  assets?: {
    icon?: MhWildsAssetFile;
    anatomy?: MhWildsAssetFile;
    anatomyPrefab?: string;
  };
  report?: {
    anatomyLayout?: { index: number; slots: MhWildsAnatomySlot[] } | null;
    hiddenPartType?: number | null;
    /** Element flags read from EnemyWeakAttrData.user.3. */
    elementalWeaknesses?: MhWildsGameElementWeakness[];
    /** The game's recommended attribute bitmask, used only as a fallback. */
    recommendedElements?: string[];
    recommendedAttributeBits?: number | null;
  };
  data?: {
    baseHealth?: number | null;
    reactionPercent?: number | null;
    parts: MhWildsPartData[];
    breaks?: MhWildsBreakData[];
  } | null;
}

export interface MhWildsBestiaryData {
  schema: number;
  generatedAt?: string;
  monsters: { id: string; variants: MhWildsMonsterVariant[] }[];
  /** Equipment/gear render thumbnails extracted from the game, not material glyphs. */
  itemThumbnails?: Record<string, MhWildsAssetFile>;
}

export interface MhMonster {
  id: number;
  gameId?: number;
  kind: string; // 'large' | 'small'
  species: string;
  name: string;
  title?: string; // [deferred] editorial subtitle (e.g. "Rey de los Cielos") — not in the MH DB API
  threat?: number; // [deferred] 1–5 threat tier — not in the MH DB API
  flagship?: boolean; // [deferred] flagship/insignia monster — not in the MH DB API
  description: string;
  baseHealth?: number;
  size: MhMonsterSize;
  ailments: unknown[];
  elements?: string[];
  weaknesses: MhMonsterWeakness[];
  resistances: MhMonsterResistance[];
  locations: MhMonsterLocation[];
  rewards: MhMonsterReward[];
  features?: string;
  tips?: string;
  variants?: unknown[];
  parts?: unknown[];
  /** Local game extraction joined by `gameId`/fixedId when available. */
  localData?: MhWildsMonsterVariant;
  localAssetVersion?: string;
}
