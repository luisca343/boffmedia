/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateOfferDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    listingId: number;
    buyerUuid: string;
    amount: number;
    qty?: number;
};

