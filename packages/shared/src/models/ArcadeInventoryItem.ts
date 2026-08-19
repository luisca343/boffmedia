/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ArcadeInventoryItem = {
    /**
     * Unique identifier for the inventory record
     */
    id: number;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Item ID
     */
    itemId: string;
    /**
     * Item data (used for Pokemon specs)
     */
    itemData: string;
    /**
     * Item type
     */
    itemType: string;
    /**
     * Item amount
     */
    amount: number;
    /**
     * Item rarity
     */
    rarity: ArcadeInventoryItem.rarity;
    /**
     * Source type (how item was obtained)
     */
    sourceType: string;
    /**
     * How many of this stack have been spent. A count, not a flag — the spend check is `amount > used`.
     */
    used: number;
    /**
     * Record creation date
     */
    createdAt: string;
    /**
     * Remaining amount (for consumables)
     */
    remainingAmount?: number;
    /**
     * Original database IDs for this aggregated item
     */
    originalIds?: Array<string>;
};
export namespace ArcadeInventoryItem {
    /**
     * Item rarity
     */
    export enum rarity {
        COMMON = 'common',
        UNCOMMON = 'uncommon',
        RARE = 'rare',
        EPIC = 'epic',
        LEGENDARY = 'legendary',
    }
}

