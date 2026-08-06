/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserTrophyEntity } from './UserTrophyEntity';
export type UserTrophiesEntity = {
    /**
     * Number of trophies earned
     */
    earnedCount: number;
    /**
     * Total number of trophies
     */
    totalCount: number;
    trophies: Array<UserTrophyEntity>;
};

