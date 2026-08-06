/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SetBalanceDto = {
    /**
     * UUID of the user whose main account balance is being set
     */
    uuid: string;
    /**
     * Absolute target balance in PokéDollars (non-negative)
     */
    balance: number;
    /**
     * Ledger memo for the correction. Defaults server-side if omitted.
     */
    concept?: string;
};

