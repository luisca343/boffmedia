/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TakeTripDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Taxi stop to travel to
     */
    stopId: string;
    /**
     * Passenger. Optional and ignored for a signed-in caller, who always travels as themselves.
     */
    uuid?: string;
};

