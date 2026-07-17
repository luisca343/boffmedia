/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateReplayDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player 1 name
     */
    side1: string;
    /**
     * Player 2 name
     */
    side2: string;
    /**
     * Player 1 team data (JSON string)
     */
    team1: string;
    /**
     * Player 2 team data (JSON string)
     */
    team2: string;
    /**
     * Battle replay data
     */
    replay: string;
    /**
     * Winner of the battle
     */
    winner: string;
};

