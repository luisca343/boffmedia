/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SpeedTierValuesDto } from './SpeedTierValuesDto';
export type SpeedTierEntryDto = {
    name: string;
    num: number;
    types: Array<string>;
    baseSpeed: number;
    abilities: Record<string, string>;
    isRestricted: boolean;
    isMythical: boolean;
    requiredItem: string | null;
    speedTiers: SpeedTierValuesDto;
};

