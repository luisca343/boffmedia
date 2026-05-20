/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ZMove = {
    /**
     * Z-Crystal required
     */
    crystal: string;
    /**
     * Z-Move name
     */
    attackName: string;
    /**
     * Z-Move base power
     */
    basePower: number;
    /**
     * Z-Move effects
     */
    effects: Array<Record<string, any>>;
    /**
     * Pokémon allowed to use this Z-Move
     */
    allowedPokemon: Array<string>;
};

