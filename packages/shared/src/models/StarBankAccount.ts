/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StarBankAccount = {
    /**
     * Unique identifier for the account
     */
    id: number;
    /**
     * Name of the account
     */
    name: string;
    /**
     * Current account balance in PokéDollars
     */
    balance: number;
    /**
     * Type of account
     */
    type: StarBankAccount.type;
    /**
     * UUID of the account owner
     */
    uuid?: string;
    /**
     * Image route/path for the account
     */
    image?: string;
};
export namespace StarBankAccount {
    /**
     * Type of account
     */
    export enum type {
        MAIN = 'MAIN',
        SECONDARY = 'SECONDARY',
        GOVERNMENT = 'GOVERNMENT',
    }
}

