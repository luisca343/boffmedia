/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UnclaimedItem } from './UnclaimedItem';
export type ClaimResponse = {
    /**
     * The items this call actually claimed. Grant from THIS, never from a client-side view of what was unclaimed — an empty array means a concurrent claim already took them.
     */
    claimedItems: Array<UnclaimedItem>;
    /**
     * Array of claimed item IDs
     */
    claimedIds: Array<number>;
    /**
     * Total number of items claimed
     */
    totalClaimed: number;
    /**
     * Success status
     */
    success: boolean;
};

