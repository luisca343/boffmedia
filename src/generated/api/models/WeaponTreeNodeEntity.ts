/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WeaponTreeNodeEntity = {
    /**
     * Unique identifier for the weapon
     */
    id: number;
    /**
     * Name of the weapon
     */
    name: string;
    /**
     * Rarity level of the weapon
     */
    rarity: number;
    /**
     * Type/kind of weapon
     */
    kind: string;
    /**
     * Damage information for the weapon
     */
    damage: Record<string, any>;
    /**
     * Special abilities or effects
     */
    specials: Array<Record<string, any>>;
    /**
     * Materials required for crafting
     */
    craftingMaterials: Array<Record<string, any>>;
    /**
     * Zenny cost for crafting
     */
    craftingZennyCost: number;
    /**
     * Materials required for upgrading
     */
    upgradeMaterials: Array<Record<string, any>>;
    /**
     * Zenny cost for upgrading
     */
    upgradeZennyCost: number;
    /**
     * Child weapons in the upgrade tree
     */
    children: Array<WeaponTreeNodeEntity>;
};

