/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArcadeInventoryItem } from './ArcadeInventoryItem';
export type ClaimItemsDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Array of inventory items to claim
     */
    items: Array<ArcadeInventoryItem>;
};

