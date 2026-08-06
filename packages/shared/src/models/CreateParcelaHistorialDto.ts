/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateParcelaHistorialDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    town: string;
    number: number;
    previousOwnerUuid?: string;
    newOwnerUuid?: string;
    reason?: string;
};

