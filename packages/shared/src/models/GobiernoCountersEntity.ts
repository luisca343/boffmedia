/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GobiernoCountersEntity = {
    /**
     * denuncias not in ('resolved','dismissed')
     */
    denuncias: number;
    /**
     * buscados with status = 'active'
     */
    buscados: number;
    /**
     * multas with status = 'pending'
     */
    multas: number;
    /**
     * apelaciones with status in ('pending','reviewing')
     */
    apelaciones: number;
};

