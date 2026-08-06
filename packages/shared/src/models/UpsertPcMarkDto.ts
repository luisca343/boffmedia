/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpsertPcMarkDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * SmartRotom user UUID
     */
    uuid: string;
    /**
     * Opaque content hash identifying the Pokémon
     */
    pokemonKey: string;
    /**
     * Favourite flag. Omit to leave unchanged.
     */
    favorite?: boolean;
    /**
     * Full replacement tag list. Omit to leave unchanged.
     */
    tags?: Array<string>;
};

