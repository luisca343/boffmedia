/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CharmEntity = {
    /**
     * Unique identifier for the charm
     */
    id: number;
    /**
     * Name of the charm
     */
    name: string;
    /**
     * Description of the charm effect
     */
    description: string;
    /**
     * Rarity level of the charm
     */
    rarity: number;
    /**
     * Skills provided by the charm
     */
    skills: Array<Record<string, any>>;
    /**
     * Materials and cost for crafting
     */
    crafting: Record<string, any>;
};

