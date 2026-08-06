/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ListingMonInputDto = {
    /**
     * Content hash of the mon (dex|palette|nature|ability|ivs). Verified against the live PC.
     */
    pokemonKey: string;
    /**
     * PC box. Alias of sourceBox.
     */
    box?: number;
    /**
     * Slot index. Alias of sourceIndex.
     */
    index?: number;
    /**
     * PC box the mon sits in
     */
    sourceBox?: number;
    /**
     * Slot index within the box
     */
    sourceIndex?: number;
    dex?: number;
    species?: string;
    form?: string;
    palette?: string;
    name?: string;
    level?: number;
    nature?: string;
    ability?: string;
    gender?: string;
    heldItem?: string;
    ball?: string;
    ot?: string;
    caughtIn?: string;
    ivs?: Array<number>;
    evs?: Array<number>;
    stats?: Array<number>;
    moves?: Array<string>;
};

