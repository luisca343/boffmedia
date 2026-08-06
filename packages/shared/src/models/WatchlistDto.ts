/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WatchlistDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    userUuid: string;
    listingId: number;
    /**
     * true = watch, false = unwatch
     */
    watching: boolean;
};

