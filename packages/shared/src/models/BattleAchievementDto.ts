/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BattleAchievementDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Achievement ID to unlock
     */
    logro: string;
    /**
     * Player 1 name
     */
    name1: string;
    /**
     * Player 2 name
     */
    name2: string;
    /**
     * Player 1 team data
     */
    team1: Array<string>;
    /**
     * Player 2 team data
     */
    team2: Array<string>;
    /**
     * Battle replay data
     */
    replay: string;
    /**
     * Whether the player won the battle
     */
    victoria: boolean;
};

