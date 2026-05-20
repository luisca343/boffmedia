/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AddLimitlessTournamentDto = {
    /**
     * Limitless tournament standings URL
     */
    url: string;
    /**
     * Regulation identifier to associate this tournament with
     */
    regulationId: string;
    /**
     * Maximum number of players to import (top N by placing). Omit for all.
     */
    maxPlayers?: number;
};

