/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchNoteDto } from './MatchNoteDto';
import type { MatchSlotDto } from './MatchSlotDto';
export type SeriesGameDto = {
    id: string;
    gameNumber: SeriesGameDto.gameNumber;
    mySlots: Array<MatchSlotDto>;
    opponentSlots: Array<MatchSlotDto>;
    result?: SeriesGameDto.result;
    notes: Array<MatchNoteDto>;
    completedAt?: number;
    outcomeTag?: SeriesGameDto.outcomeTag;
    turnCount?: number;
};
export namespace SeriesGameDto {
    export enum gameNumber {
        '_1' = 1,
        '_2' = 2,
        '_3' = 3,
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

