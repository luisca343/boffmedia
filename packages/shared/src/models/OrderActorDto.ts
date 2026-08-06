/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrderActorDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Who is acting. /transferred expects the seller, /confirm and /cancel the buyer.
     */
    actorUuid?: string;
};

