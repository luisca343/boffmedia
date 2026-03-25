/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CacheStatusResponse = {
    /**
     * Whether cache is active
     */
    cached: boolean;
    /**
     * Cache age in milliseconds
     */
    age?: number;
    /**
     * Milliseconds until next refresh
     */
    nextRefresh?: number;
    /**
     * Cache health status
     */
    healthy: boolean;
};

