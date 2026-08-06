/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RookerPostAuthorEntity = {
    uuid: string;
    username: string;
    handle?: Record<string, any> | null;
    displayName?: Record<string, any> | null;
    partnerPokemonId?: Record<string, any> | null;
    /**
     * Always false — no verification system exists yet.
     */
    isVerified: boolean;
};

