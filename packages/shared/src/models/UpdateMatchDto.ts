/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateMatchDto = {
    myTeam?: Record<string, any>;
    opponentTeam?: Record<string, any>;
    opponentName?: string;
    result?: UpdateMatchDto.result;
    eloAfter?: number;
    opponentElo?: number;
    notes?: Array<string>;
    completedAt?: string;
};
export namespace UpdateMatchDto {
    export enum result {
        WIN = 'win',
        LOSS = 'loss',
        DRAW = 'draw',
    }
}

