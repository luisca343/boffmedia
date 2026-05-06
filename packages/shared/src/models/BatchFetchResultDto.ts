/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BatchFetchResultDto = {
    /**
     * Total teams with paste URLs that needed fetching
     */
    total: number;
    /**
     * Newly fetched pastes
     */
    fetched: number;
    /**
     * Pastes already cached (skipped)
     */
    cached: number;
    /**
     * Pastes that failed to fetch
     */
    failed: number;
};

