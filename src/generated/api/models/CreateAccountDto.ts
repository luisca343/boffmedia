/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAccountDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * UUID of the user
     */
    uuid: string;
    /**
     * Name of the account
     */
    name: string;
    /**
     * Type of the account
     */
    type?: CreateAccountDto.type;
    /**
     * Initial balance of the account in PokéDollars
     */
    initialBalance?: number;
};
export namespace CreateAccountDto {
    /**
     * Type of the account
     */
    export enum type {
        MAIN = 'MAIN',
        SECONDARY = 'SECONDARY',
    }
}

