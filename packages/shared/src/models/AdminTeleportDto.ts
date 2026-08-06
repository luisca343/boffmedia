/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminTeleportDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Taxi stop to move the player to
     */
    stopId: string;
    /**
     * The player being moved. Required — this is not a self-service action.
     */
    uuid: string;
    /**
     * Why they were moved. Recorded in the audit trail and whispered to the player.
     */
    reason?: string;
};

