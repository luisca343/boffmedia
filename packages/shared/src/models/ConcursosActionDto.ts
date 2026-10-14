/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosActionDto = {
    action: ConcursosActionDto.action;
    questionId?: string;
    roundId?: number;
    choice?: number;
};
export namespace ConcursosActionDto {
    export enum action {
        CHOOSE = 'choose',
        PROPOSE = 'propose',
        ANSWER = 'answer',
        NEXT = 'next',
    }
}

