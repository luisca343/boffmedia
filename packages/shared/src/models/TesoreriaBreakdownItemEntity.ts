/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TesoreriaBreakdownItemEntity = {
    /**
     * Human label for the transaction type
     */
    concept: string;
    amount: number;
    count: number;
    /**
     * Which department the money moved through — drives the spine colour
     */
    dep: string;
};

