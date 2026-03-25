/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ArmorEntity = {
    /**
     * Unique identifier for the armor piece
     */
    id: number;
    /**
     * Name of the armor piece
     */
    name: string;
    /**
     * Rarity level of the armor
     */
    rarity: number;
    /**
     * Type of armor piece (head, chest, arms, waist, legs)
     */
    type: string;
    /**
     * Defense values for the armor
     */
    defense: Record<string, any>;
    /**
     * Skills provided by the armor
     */
    skills: Array<Record<string, any>>;
    /**
     * Decoration slots available
     */
    slots: Array<number>;
    /**
     * Materials required for crafting
     */
    craftingMaterials: Array<Record<string, any>>;
    /**
     * Zenny cost for crafting
     */
    craftingZennyCost: number;
};

