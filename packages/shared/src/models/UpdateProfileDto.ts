/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateProfileDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Owner UUID
     */
    uuid: string;
    handle?: string;
    displayName?: string;
    bio?: string;
    link?: string;
    /**
     * Species id — must be caught in the owner’s pokédex
     */
    partnerPokemonId?: number;
};

