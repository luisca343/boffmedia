/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DailyRewardBox } from './DailyRewardBox';
export type DailyRewardItem = {
    /**
     * Day number in the streak cycle
     */
    day: number;
    /**
     * Type of reward (box, coins, item, etc)
     */
    type: DailyRewardItem.type;
    /**
     * Amount of the reward to give
     */
    amount: number;
    /**
     * Additional details about the reward, like box type or item ID
     */
    description: string;
    /**
     * Details about the box if the reward is a box
     */
    box?: DailyRewardBox;
};
export namespace DailyRewardItem {
    /**
     * Type of reward (box, coins, item, etc)
     */
    export enum type {
        BOX = 'box',
        COINS = 'coins',
        ITEM = 'item',
        EXPERIENCE = 'experience',
    }
}

