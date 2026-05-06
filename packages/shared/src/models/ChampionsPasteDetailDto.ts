/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SpreadEntryDto } from './SpreadEntryDto';
import type { UsageEntryDto } from './UsageEntryDto';
export type ChampionsPasteDetailDto = {
    speciesId: string;
    speciesName: string;
    /**
     * Number of pastes this Pokémon appeared in
     */
    pasteCount: number;
    abilities: Array<UsageEntryDto>;
    items: Array<UsageEntryDto>;
    moves: Array<UsageEntryDto>;
    teraTypes: Array<UsageEntryDto>;
    spreads: Array<SpreadEntryDto>;
};

