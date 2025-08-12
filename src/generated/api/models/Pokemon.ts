/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PokemonForm } from './PokemonForm';
export type Pokemon = {
    /**
     * Pokémon name
     */
    name: string;
    /**
     * Pokédex number
     */
    dex: number;
    /**
     * Default form names
     */
    defaultForms: Array<string>;
    /**
     * Available forms
     */
    forms: Array<PokemonForm>;
    /**
     * Generation number
     */
    generation: number;
    /**
     * Whether this is a custom Pokémon
     */
    isCustom?: boolean;
};

