/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateDexDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * User UUID
     */
    uuid: string;
    /**
     * Array of seen Pokémon IDs
     */
    SEEN: Array<number>;
    /**
     * Array of caught Pokémon IDs
     */
    CAUGHT: Array<number>;
};

