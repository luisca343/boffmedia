/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NewsStatusDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Array of news IDs to publish
     */
    published: Array<number>;
    /**
     * News ID to feature
     */
    featured: number;
};

