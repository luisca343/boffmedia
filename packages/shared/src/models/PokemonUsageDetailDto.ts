/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseStatsDto } from './BaseStatsDto';
import type { SpreadUsageDto } from './SpreadUsageDto';
import type { UsageStatDto } from './UsageStatDto';
export type PokemonUsageDetailDto = {
    speciesId: string;
    speciesName: string;
    rank: number;
    types: Array<string>;
    usagePercent: number;
    rawCount: number;
    topItem?: string;
    topMove?: string;
    topTeraType?: string;
    baseStats: BaseStatsDto;
    abilities: Array<UsageStatDto>;
    items: Array<UsageStatDto>;
    moves: Array<UsageStatDto>;
    teraTypes: Array<UsageStatDto>;
    teammates: Array<UsageStatDto>;
    spreads: Array<SpreadUsageDto>;
};

