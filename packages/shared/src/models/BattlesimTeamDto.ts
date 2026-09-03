/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimTeamDto = {
    /**
     * Unique team id
     */
    id: string;
    /**
     * Client-generated id for idempotency
     */
    clientId: string;
    /**
     * Team name
     */
    name: string;
    /**
     * Battle format
     */
    format: string;
    /**
     * Team in Showdown packed format
     */
    packed: string;
    /**
     * Client's last update timestamp (epoch ms)
     */
    clientUpdatedAt: Record<string, any> | null;
    /**
     * Server creation timestamp
     */
    createdAt: string;
    /**
     * Server update timestamp
     */
    updatedAt: string;
    /**
     * Tombstone timestamp (epoch ms), null if not deleted
     */
    deletedAt: Record<string, any> | null;
};

