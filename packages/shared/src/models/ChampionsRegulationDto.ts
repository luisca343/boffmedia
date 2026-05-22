/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChampionsRegulationDto = {
    id: string;
    formatId: string;
    name: string;
    gameType: string;
    vgcPastesGid: Record<string, any> | null;
    importStatus?: ChampionsRegulationDto.importStatus;
    importError?: Record<string, any> | null;
    importTeamCount?: number;
    importFetchedCount?: number;
    importStartedAt?: Record<string, any> | null;
    importCompletedAt?: Record<string, any> | null;
    active: number;
    createdAt: string;
};
export namespace ChampionsRegulationDto {
    export enum importStatus {
        IDLE = 'idle',
        RUNNING_CSV = 'running_csv',
        RUNNING_PASTES = 'running_pastes',
        DONE = 'done',
        ERROR = 'error',
    }
}

