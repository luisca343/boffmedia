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
    userId?: number;
};
export namespace CreateMatchDto {
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
}

