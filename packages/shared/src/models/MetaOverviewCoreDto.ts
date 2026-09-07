/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MetaOverviewCorePokemonDto } from './MetaOverviewCorePokemonDto';
export type MetaOverviewCoreDto = {
    /**
     * Number of Pokemon in this core.
     */
    size: number;
    pokemon: Array<MetaOverviewCorePokemonDto>;
    teamCount: number;
    usagePercent: number;
};

