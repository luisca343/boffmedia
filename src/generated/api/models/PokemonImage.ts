/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PokemonImage = {
    /**
     * Image URL
     */
    url: string;
    /**
     * Image type
     */
    type: PokemonImage.type;
    /**
     * Pokémon status (0=unseen, 1=seen, 2=caught)
     */
    status: PokemonImage.status;
    /**
     * Whether to show the image
     */
    showImg: boolean;
};
export namespace PokemonImage {
    /**
     * Image type
     */
    export enum type {
        IMAGE = 'image',
        SPRITE = 'sprite',
    }
    /**
     * Pokémon status (0=unseen, 1=seen, 2=caught)
     */
    export enum status {
        '_0' = 0,
        '_1' = 1,
        '_2' = 2,
    }
}

