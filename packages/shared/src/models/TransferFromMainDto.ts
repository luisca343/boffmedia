/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TransferFromMainDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * UUID of the user whose main account will be used as source
     */
    uuid: string;
    /**
     * Account ID to transfer funds to
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

