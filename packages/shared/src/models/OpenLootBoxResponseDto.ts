/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LootboxItemConfig } from './LootboxItemConfig';
import type { SpinnerItemDto } from './SpinnerItemDto';
export type OpenLootBoxResponseDto = {
    /**
     * The item obtained from the loot box
     */
    item?: LootboxItemConfig;
    /**
     * Array of items to display in the spinner animation
     */
    spinnerItems?: Array<SpinnerItemDto>;
    /**
     * Position of the winning item in the spinner array
     */
    winningPosition?: number;
};

