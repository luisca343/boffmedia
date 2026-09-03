/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimReplayDto = {
    /**
     * Unique replay id
     */
    id: string;
    /**
     * Client-generated id for idempotency
     */
    clientId: string;
    /**
     * Battle format
     */
    format: string;
    /**
     * Player 1 name
     */
    p1Name: string;
    /**
     * Player 2 name
     */
    p2Name: string;
    /**
     * Winner name or null for draw
     */
    winner: Record<string, any> | null;
    /**
     * Team snapshots as JSON
     */
    teams: Record<string, any> | null;
    /**
     * Battle source
     */
    source: string;
    /**
     * Opponent user id (for PvP battles)
     */
    opponentUserId: Record<string, any> | null;
    /**
     * When the battle was played (epoch ms)
     */
    playedAt: number;
    /**
     * Server creation timestamp
     */
    createdAt: string;
    /**
     * Server update timestamp
     */
    updatedAt: string;
};

