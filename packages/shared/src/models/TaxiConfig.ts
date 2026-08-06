/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaxiConfig = {
    minimumFare: number;
    pricePerBlock: number;
    /**
     * The StarBank account fares are paid into. The travel history is reconstructed from transfers into it, so the web must read this rather than hardcode an id.
     */
    serviceAccountId: number;
    tripConceptPrefix: string;
};

