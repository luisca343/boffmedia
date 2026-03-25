/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EvolutionMethod } from './EvolutionMethod';
export type EvolutionNode = {
    /**
     * Pokémon name
     */
    pkm: string;
    /**
     * Pokédex number
     */
    dex: number;
    /**
     * Form index
     */
    index?: number;
    /**
     * Evolution methods
     */
    methods?: Array<EvolutionMethod>;
    /**
     * Child evolutions
     */
    evos: Record<string, EvolutionNode>;
};

