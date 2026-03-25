/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TrainerDefeatMoneyDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * UUID of the trainer who won the battle
     */
    uuid: string;
    /**
     * Amount of money to award for the victory in PokéDollars
     */
    money: number;
};

