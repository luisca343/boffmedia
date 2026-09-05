/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattlesimLeagueReplayDto = {
    /**
     * League replay id (integer)
     */
    id: number;
    /**
     * Player 1 display side
     */
    side1: string;
    /**
     * Player 2 display side
     */
    side2: string;
    /**
     * Player 1 team paste
     */
    team1: string;
    /**
     * Player 2 team paste
     */
    team2: string;
    /**
     * Showdown protocol transcript
     */
    replay: string;
    /**
     * When the battle was played
     */
    createdAt: string;
};

