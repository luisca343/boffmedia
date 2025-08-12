/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GameRewardDto } from './GameRewardDto';
export type EndGameDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Array of rewards obtained in the game
     */
    rewards: Array<GameRewardDto>;
};

