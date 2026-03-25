/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RewardsByType = {
    /**
     * Rewards grouped by type
     */
    drops: Record<string, {
        items?: any[];
        totalValue?: number;
    }>;
    /**
     * Total value of all rewards
     */
    totalValue: number;
};

