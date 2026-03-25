/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SystemHealthResponse = {
    /**
     * Overall system health
     */
    overall: SystemHealthResponse.overall;
    /**
     * Cache system status
     */
    cache: boolean;
    /**
     * External API status
     */
    externalAPI: boolean;
    /**
     * File system status
     */
    fileSystem: boolean;
};
export namespace SystemHealthResponse {
    /**
     * Overall system health
     */
    export enum overall {
        HEALTHY = 'healthy',
        DEGRADED = 'degraded',
        UNHEALTHY = 'unhealthy',
    }
}

