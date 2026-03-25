/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import { ArcadeInventoryItem } from "./ArcadeInventoryItem";

/* eslint-disable */
export type ArcadeStreak = {
    /**
     * Last time the user claimed a reward
     */
    lastClaimed: string | null;
    /**
     * Current streak count
     */
    streak: number;
    /**
     * Total number of claims made
     */
    totalClaims: number;
    /**
     * Last banner the user interacted with
     */
    lastBanner: string | null;
    /**
     * Current day in the reward cycle
     */
    currentDay: number;
    /**
     * Total days in the reward cycle
     */
    totalDays: number;
    /**
     * Next reward information
     */
    nextReward: ArcadeInventoryItem;
    /**
     * Current active banner
     */
    currentBanner: string;
    /**
     * Whether user has claimed reward today
     */
    claimedToday: boolean;
    /**
     * Next daily reset time
     */
    nextResetTime: string;
    /**
     * Whether banner has changed since last claim
     */
    bannerChanged: boolean;
};

