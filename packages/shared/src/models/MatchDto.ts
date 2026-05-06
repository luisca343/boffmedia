/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchNoteDto } from './MatchNoteDto';
import type { TeamSnapshotDto } from './TeamSnapshotDto';
export type MatchDto = {
    id: string;
    sessionId: string;
    format: MatchDto.format;
    createdAt: number;
    completedAt?: number;
    myTeam: TeamSnapshotDto;
    opponentTeam: TeamSnapshotDto;
    opponentName?: string;
    result?: MatchDto.result;
    eloAfter?: number;
    opponentElo?: number;
    notes: Array<MatchNoteDto>;
    outcomeTag?: MatchDto.outcomeTag;
    turnCount?: number;
    opponentArchetype?: string;
    updatedAt?: number;
};
export namespace MatchDto {
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
    export enum result {
        WIN = 'win',
        LOSS = 'loss',
        DRAW = 'draw',
    }
    export enum outcomeTag {
        SKILL = 'skill',
        MISPLAY = 'misplay',
        LUCK = 'luck',
        DISCONNECT = 'disconnect',
    }
}

