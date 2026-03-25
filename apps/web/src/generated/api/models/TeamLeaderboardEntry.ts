/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TeamLeaderboardEntry = {
    /**
     * Team ID
     */
    teamId: number;
    /**
     * Team name
     */
    teamName: string;
    /**
     * Team tag
     */
    teamTag?: string;
    /**
     * Team icon
     */
    teamIcon?: string;
    /**
     * Total team points
     */
    totalPoints: number;
    /**
     * Team score (alias for totalPoints)
     */
    score: number;
    /**
     * Number of team members
     */
    memberCount: number;
    /**
     * Current rank position
     */
    rank: number;
};

