/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimReplayUploadDto = {
    /**
     * Client-generated id for idempotent uploads
     */
    clientId: string;
    /**
     * Battle format (e.g., gen9randomdoublesbattle)
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
     * Winner name (null for draw)
     */
    winner?: string;
    /**
     * Protocol log (battle transcript). Must not exceed ~8 MB (MEDIUMTEXT limit)
     */
    log: string;
    /**
     * Team snapshots as JSON string
     */
    teams?: string;
    /**
     * Battle source
     */
    source: BattlesimReplayUploadDto.source;
    /**
     * When the battle was played (epoch ms)
     */
    playedAt: number;
};
export namespace BattlesimReplayUploadDto {
    /**
     * Battle source
     */
    export enum source {
        LOCAL = 'local',
        PVP = 'pvp',
    }
}

