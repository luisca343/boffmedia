/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArcadeInventoryItem } from './ArcadeInventoryItem';
import type { InventoryItemGroup } from './InventoryItemGroup';
export type ArcadeInventoryResponse = {
    /**
     * Aggregated inventory items list
     */
    items: Array<ArcadeInventoryItem>;
    /**
     * Items grouped by their type
     */
    groupedItems: InventoryItemGroup;
    /**
     * Raw inventory items from database without aggregation
     */
    rawItems: Array<ArcadeInventoryItem>;
};

