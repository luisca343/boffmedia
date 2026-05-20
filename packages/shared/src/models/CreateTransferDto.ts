/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateTransferDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * ID of the source account
     */
    from: number;
    /**
     * ID of the destination account
     */
    to: number;
    /**
     * Amount to transfer in PokéDollars
     */
    amount: number;
    /**
     * Reason or description for the transfer
     */
    concept: string;
};

