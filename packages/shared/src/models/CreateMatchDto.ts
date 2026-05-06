/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMatchDto = {
    id: string;
    sessionId: string;
    format: CreateMatchDto.format;
    myTeam: Record<string, any>;
    opponentTeam: Record<string, any>;
    opponentName?: string;
    opponentArchetype?: string;
    result?: CreateMatchDto.result;
    outcomeTag?: string;
    turnCount?: number;
    eloAfter?: number;
    opponentElo?: number;
    notes?: any[];
    createdAt?: number;
    completedAt?: number;
    clientUpdatedAt?: number;
    userId?: number;
};
export namespace CreateMatchDto {
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
    export enum result {
        WIN = 'win',
        LOSS = 'loss',
        DRAW = 'draw',
    }
}

