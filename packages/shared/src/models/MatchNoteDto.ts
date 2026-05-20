/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MatchNoteDto = {
    id: string;
    text: string;
    createdAt: number;
    phase: MatchNoteDto.phase;
};
export namespace MatchNoteDto {
    export enum phase {
        LIVE = 'live',
        POST = 'post',
        SERIES = 'series',
    }
}

