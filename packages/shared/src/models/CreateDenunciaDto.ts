/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateDenunciaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    town?: string;
    plotNumber?: number;
    accusedUuid?: string;
    reporterUuid: string;
    /**
     * Free-form category
     */
    category: string;
    description: string;
};

