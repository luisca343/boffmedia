/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ArcadeInventoryItem } from './ArcadeInventoryItem';
import type { ArcadeStreak } from './ArcadeStreak';
import type { DailyRewardItem } from './DailyRewardItem';
export type ArcadeStreakClaim = {
    /**
     * Updated streak information after claim
     */
    streak: ArcadeStreak;
    /**
     * The reward that was claimed
     */
    reward: DailyRewardItem;
    /**
     * Items added to inventory as part of the claim
     */
    inventoryItems?: Array<ArcadeInventoryItem>;
};

