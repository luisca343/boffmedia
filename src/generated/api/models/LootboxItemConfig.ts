/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LootboxItemConfig = {
    /**
     * Unique identifier for the item
     */
    id: string;
    /**
     * Weight value determining item rarity probability
     */
    weight: number;
    /**
     * Rarity category of the item
     */
    rarity: LootboxItemConfig.rarity;
    /**
     * Type of the item
     */
    type: string;
    /**
     * Additional data associated with the item
     */
    data: any;
};
export namespace LootboxItemConfig {
    /**
     * Rarity category of the item
     */
    export enum rarity {
        COMMON = 'common',
        UNCOMMON = 'uncommon',
        RARE = 'rare',
        EPIC = 'epic',
        LEGENDARY = 'legendary',
    }
}

