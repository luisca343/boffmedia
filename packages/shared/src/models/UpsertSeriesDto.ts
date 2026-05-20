/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpsertSeriesDto = {
    id: string;
    sessionId: string;
    createdAt: number;
    completedAt?: number;
    roundNumber?: number;
    opponentName?: string;
    opponentArchetype?: string;
    myTeam: Record<string, any>;
    opponentTeam: Record<string, any>;
    games: any[];
    seriesResult?: string;
    notes: any[];
    clientUpdatedAt?: number;
    userId?: number;
};

