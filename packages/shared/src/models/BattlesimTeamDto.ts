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
     * User-defined tags for organizing teams
     */
    tags: Array<string>;
    /**
     * Whether the team is in the account favorites
     */
    favorite: boolean;
    /**
     * Whether the team is pinned in the library
     */
    pinned: boolean;
    /**
     * Private strategy notes for this team
     */
    notes: string | null;
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

