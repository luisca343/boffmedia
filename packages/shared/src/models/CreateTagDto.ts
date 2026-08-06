/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateTagDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Owner UUID
     */
    uuid: string;
    /**
     * Tag label
     */
    label: string;
    /**
     * Semantic palette key
     */
    color?: string;
};

