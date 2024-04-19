export interface Pokemon {
    name: string;
    dex: number;
    defaultForms: string[];
    forms: Form[];
    generation: number;
}

export interface Form {
    pkmName?: string;
    pkmDex?: number;
    pkmGeneration?: number;
    name: string;
    experienceGroup?: string;
    dimensions?: Dimensions;
    moves?: Moves;
    abilities?: Abilities;
    movement?: Movement;
    aggression?: Aggression;
    battleStats?: BattleStats;
    tags?: string[];
    spawn?: Spawn;
    possibleGenders?: string[];
    genderProperties?: GenderProperties[];
    eggGroups?: string[];
    types?: string[];
    preEvolutions?: any[];
    defaultBaseForm?: string;
    megaItems?: any[];
    megas?: any[];
    gigantamax?: Gigantamax;
    eggCycles?: number;
    weight?: number;
    catchRate?: number;
    malePercentage?: number;
    evolutions?: Evolution[];
    evYields?: EvYields;
}

export interface Dimensions {
    height: number;
    width: number;
    length: number;
    eyeHeight: number;
    hoverHeight: number;
}

export interface Moves {
    levelUpMoves?: LevelUpMove[];
    tutorMoves?: string[];
    eggMoves?: string[];
    tmMoves8?: string[];
    trMoves?: string[];
    hmMoves?: string[];
    transferMoves?: string[];
    tmMoves7?: string[];
    tmMoves6?: string[];
    tmMoves5?: string[];
    tmMoves4?: string[];
    tmMoves3?: string[];
    tmMoves2?: string[];
    tmMoves1?: string[];
    tmMoves?: string[];
}

export interface LevelUpMove {
    level: number;
    attacks: string[];
}

export interface Abilities {
    abilities: string[];
    hiddenAbilities: string[];
}

export interface Movement {
    rideable: boolean;
    canFly: boolean;
    canSurf: boolean;
    canRideShoulder: boolean;
}

export interface Aggression {
    timid: number;
    passive: number;
    aggressive: number;
}

export interface BattleStats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

export interface Spawn {
    baseExp: number;
    baseFriendship: number;
    spawnLevel: number;
    spawnLevelRange: number;
    spawnLocations: string[];
}

export interface GenderProperties {
    gender: string;
    palettes: Palette[];
}

export interface Palette {
    name: string;
    texture: string;
    sprite: string;
    particle: string;
    modelLocator?: ModelLocator;
    sounds?: string[];
    emissive?: string;
}

export interface ModelLocator {
    factoryType: string;
    pqc: string[];
}

export interface Gigantamax {
    canHaveFactor: boolean;
    canGigantamax: boolean;
}

export interface Evolution {
    item: Item;
    to: string;
    conditions: any[];
    evoType: string;
    moves?: string[];
    level?: number;
}

export interface Item {
    itemID: string;
}

export interface EvYields {
    speed?: number;
    specialDefense?: number;
    specialAttack?: number;
    defense?: number;
    attack?: number;
    hp?: number;

}