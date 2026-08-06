/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PcMark = {
    /**
     * Unique identifier for the mark
     */
    id: number;
    /**
     * SmartRotom user UUID the mark belongs to
     */
    uuid: string;
    /**
     * Opaque content hash identifying the Pokémon (dex|palette|nature|ability|ivs). Computed by the client; never validated by the API.
     */
    pokemonKey: string;
    /**
     * Whether the Pokémon is favourited
     */
    favorite: boolean;
    /**
     * User-defined tags for the Pokémon
     */
    tags: Array<string>;
    /**
     * Record creation date
     */
    createdAt?: string;
    /**
     * Record last update date
     */
    updatedAt?: string;
};

