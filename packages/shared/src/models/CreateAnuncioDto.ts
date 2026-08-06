/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAnuncioDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    kind?: string;
    title: string;
    body: string;
    town?: string;
    authorUuid: string;
    pinned?: boolean;
    audience?: string;
};

