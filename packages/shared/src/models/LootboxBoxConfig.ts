/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LootboxItemConfig } from './LootboxItemConfig';
export type LootboxBoxConfig = {
    /**
     * Unique identifier for the lootbox
     */
    id: string;
    /**
     * Display name of the lootbox
     */
    name: string;
    /**
     * Image path for the lootbox
     */
    image: string;
    /**
     * Description of the lootbox contents
     */
    description: string;
    /**
     * Items that can be obtained from this lootbox
     */
    items: Array<LootboxItemConfig>;
    /**
     * Theme color for the lootbox UI
     */
    theme: string;
};

