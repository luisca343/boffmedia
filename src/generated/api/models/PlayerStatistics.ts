/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlayerRankInfo } from './PlayerRankInfo';
export type PlayerStatistics = {
    /**
     * Total number of games played
     */
    totalGames: number;
    /**
     * Total value earned across all games
     */
    totalValue: number;
    /**
     * Average value per game
     */
    averageValue: number;
    /**
     * Date of last game played
     */
    lastPlayed: string | null;
    /**
     * Player ranking information
     */
    ranking: PlayerRankInfo | null;
};

