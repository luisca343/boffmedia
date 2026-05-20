/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PokemonEvolution = {
    /**
     * Evolution target
     */
    to: string;
    /**
     * Evolution type
     */
    evoType: string;
    /**
     * Evolution conditions
     */
    conditions?: Array<string>;
    /**
     * Required item for evolution
     */
    item?: Record<string, any>;
    /**
     * Moves learned upon evolution
     */
    moves?: Array<string>;
};

