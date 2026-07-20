/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConsumeInventoryItemDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Item ID to consume
     */
    itemId: string;
    /**
     * Amount to consume
     */
    amount?: number;
};

