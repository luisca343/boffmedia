/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BulkUpsertPcMarksDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Opaque content hashes of the Pokémon to mark
     */
    pokemonKeys: Array<string>;
    /**
     * Favourite flag applied to every key. Omit to leave unchanged.
     */
    favorite?: boolean;
    /**
     * Tags to add to every key
     */
    addTags?: Array<string>;
    /**
     * Tags to remove from every key
     */
    removeTags?: Array<string>;
};

