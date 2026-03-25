/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RegisterPokemonDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * User UUID
     */
    uuid: string;
    /**
     * Pokémon ID
     */
    pokemonId: number;
    /**
     * Form name
     */
    form: string;
    /**
     * Palette name
     */
    palette: string;
    /**
     * Status (0=seen, 1=caught)
     */
    status: RegisterPokemonDto.status;
};
export namespace RegisterPokemonDto {
    /**
     * Status (0=seen, 1=caught)
     */
    export enum status {
        '_0' = 0,
        '_1' = 1,
    }
}

