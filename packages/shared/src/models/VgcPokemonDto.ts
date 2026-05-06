/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseStatsDto } from './BaseStatsDto';
export type VgcPokemonDto = {
    name: string;
    num: number;
    types: Array<string>;
    baseStats: BaseStatsDto;
    abilities: Record<string, string>;
    weightkg: number;
    isRestricted: boolean;
    isMythical: boolean;
    requiredItem: string | null;
};

