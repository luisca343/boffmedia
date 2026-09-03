/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimTeamUploadDto = {
    /**
     * Client-generated id for idempotent uploads
     */
    clientId: string;
    /**
     * Team name
     */
    name: string;
    /**
     * Battle format (e.g., gen9vgc2025regulationc)
     */
    format: string;
    /**
     * Team in Showdown packed format
     */
    packed: string;
    /**
     * Client's last update timestamp (epoch ms) for merge conflict resolution
     */
    clientUpdatedAt?: number;
    /**
     * Tombstone timestamp (epoch ms) if this is a deletion, null otherwise
     */
    deletedAt?: Record<string, any> | null;
};

