/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WigglypopListingMonEntity = {
    id: number;
    pokemonKey: string;
    /**
     * PC box the mon sat in when listed
     */
    sourceBox: number;
    sourceIndex: number;
    dex: number;
    species: string;
    form?: Record<string, any> | null;
    palette?: Record<string, any> | null;
    name?: Record<string, any> | null;
    level: number;
    nature?: Record<string, any> | null;
    ability?: Record<string, any> | null;
    gender?: Record<string, any> | null;
    heldItem?: Record<string, any> | null;
    ball?: Record<string, any> | null;
    ot?: Record<string, any> | null;
    caughtIn?: Record<string, any> | null;
    ivs: Array<number> | null;
    evs: Array<number> | null;
    stats: Array<number> | null;
    moves: Array<string> | null;
    rarity: string;
    legendary: boolean;
    shiny: boolean;
    /**
     * Deterministic valuation at listing time
     */
    value: number;
};

