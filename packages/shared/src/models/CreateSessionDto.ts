/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSessionDto = {
    id: string;
    label: string;
    format: CreateSessionDto.format;
    regulationId: string;
    activePresetId?: string;
    startElo?: number;
    userId?: number;
};
export namespace CreateSessionDto {
    export enum format {
        BO1 = 'BO1',
        BO3 = 'BO3',
    }
}

