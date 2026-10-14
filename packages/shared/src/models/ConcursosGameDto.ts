/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosBoardItemDto } from './ConcursosBoardItemDto';
import type { ConcursosOwnAnswerDto } from './ConcursosOwnAnswerDto';
import type { ConcursosResultDto } from './ConcursosResultDto';
import type { ConcursosVisibleQuestionDto } from './ConcursosVisibleQuestionDto';
export type ConcursosGameDto = {
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
    export enum stage {
        BOARD = 'board',
        QUESTION = 'question',
        RESULT = 'result',
        FINISHED = 'finished',
    }
}

