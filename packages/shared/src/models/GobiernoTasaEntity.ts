/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GobiernoTasaEntity = {
    id: number;
    code: string;
    concept: string;
    kind: string;
    rate: string;
    amount: number;
    active: boolean;
    /**
     * DERIVED, never stored: the sum of TASA transactions into the treasury whose reason carries this code. The rate card says what is charged; the ledger says what was actually collected.
     */
    collected: number;
    createdAt: string;
    updatedAt: string;
};

