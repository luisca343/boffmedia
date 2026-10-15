/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosActionDto = {
    action: ConcursosActionDto.action;
    controlRevision?: number;
    questionId?: string;
    /**
     * Current round; zero is the initial board before the first question.
     */
    roundId?: number;
    choice?: number;
};
export namespace ConcursosActionDto {
    export enum action {
        CHOOSE = 'choose',
        PROPOSE = 'propose',
        ANSWER = 'answer',
        NEXT = 'next',
        PAUSE = 'pause',
        RESUME = 'resume',
    }
}

