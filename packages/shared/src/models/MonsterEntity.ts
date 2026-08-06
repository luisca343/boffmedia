/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MonsterEntity = {
    /**
     * Unique identifier for the monster
     */
    id: number;
    /**
     * Name of the monster
     */
    name: string;
    /**
     * Monster class (large or small)
     */
    kind: string;
    /**
     * Species / classification of the monster
     */
    species: string;
    /**
     * Flavour description of the monster
     */
    description: string;
    /**
     * Base health at low rank
     */
    baseHealth?: number;
    /**
     * Size thresholds (base/mini/silver/gold crowns)
     */
    size: Record<string, any>;
    /**
     * Elemental / status / effect weaknesses
     */
    weaknesses: Array<any[]>;
    /**
     * Elemental / effect resistances
     */
    resistances: Array<any[]>;
    /**
     * Ailments the monster can inflict
     */
    ailments: Array<any[]>;
    /**
     * Elements the monster uses
     */
    elements: Array<any[]>;
    /**
     * Locations where the monster appears
     */
    locations: Array<any[]>;
    /**
     * Carve / capture / reward drops
     */
    rewards: Array<any[]>;
};

