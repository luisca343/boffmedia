/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosBoardItemDto } from './ConcursosBoardItemDto';
import type { ConcursosOwnAnswerDto } from './ConcursosOwnAnswerDto';
import type { ConcursosResultDto } from './ConcursosResultDto';
import type { ConcursosVisibleQuestionDto } from './ConcursosVisibleQuestionDto';
export type ConcursosGameDto = {
    paused: boolean;
    controlRevision: number;
    pauseReason?: ConcursosGameDto.pauseReason;
    selectionRevision: number;
    selectionSkipAt?: number;
    selectionRemainingMs?: number;
    remainingMs?: number;
    resumeAt?: number;
    pacing: ConcursosGameDto.pacing;
    resultSeconds: number;
    advanceAt?: number;
    stage: ConcursosGameDto.stage;
    roundId: number;
    selectorId: string;
    phaseTitle: string;
    board: Array<ConcursosBoardItemDto>;
    question?: ConcursosVisibleQuestionDto;
    deadlineAt?: number;
    serverNow: number;
    own?: ConcursosOwnAnswerDto;
    results?: Array<ConcursosResultDto>;
};
export namespace ConcursosGameDto {
    export enum pauseReason {
        MANUAL = 'manual',
        HOST_DISCONNECTED = 'host_disconnected',
        PLAYERS_DISCONNECTED = 'players_disconnected',
        API_RESTARTED = 'api_restarted',
        STORAGE_UNAVAILABLE = 'storage_unavailable',
    }
    export enum pacing {
        AUTOMATIC = 'automatic',
        DIRECTED = 'directed',
    }
    export enum stage {
        BOARD = 'board',
        QUESTION = 'question',
        RESULT = 'result',
        FINISHED = 'finished',
    }
}

