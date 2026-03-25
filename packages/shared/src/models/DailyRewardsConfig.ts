/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DailyRewardItem } from './DailyRewardItem';
export type DailyRewardsConfig = {
    /**
     * Number of days in the reward cycle
     */
    totalDays: number;
    /**
     * Name of this rewards banner
     */
    name: string;
    /**
     * List of daily rewards
     */
    rewards: Array<DailyRewardItem>;
};

