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
     * Battle format. Must be a registered id from battle-core BSIM_FORMATS.
     */
    format: string;
    /**
     * Team in Showdown packed format
     */
    packed: string;
    /**
     * User-defined tags for organizing teams
     */
    tags?: Array<any[]>;
    /**
     * Whether the team is in the account favorites
     */
    favorite?: boolean;
    /**
     * Whether the team is pinned in the library
     */
    pinned?: boolean;
    /**
     * Private strategy notes for this team
     */
    notes?: string | null;
    /**
     * Client's last update timestamp (epoch ms) for merge conflict resolution
     */
    clientUpdatedAt?: number;
    /**
     * Tombstone timestamp (epoch ms) if this is a deletion, null otherwise
     */
    deletedAt?: Record<string, any> | null;
};

