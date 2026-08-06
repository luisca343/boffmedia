/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ListingItemInputDto = {
    itemId: string;
    qty: number;
    /**
     * Defaults to the catalog name when omitted
     */
    itemName?: string;
    category?: string;
    /**
     * Overrides the catalog reference price. Omit to price at catalog value.
     */
    unitPrice?: number;
};

