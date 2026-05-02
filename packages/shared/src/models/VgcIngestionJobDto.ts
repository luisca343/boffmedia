/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VgcIngestionJobDto = {
    id: string;
    type: VgcIngestionJobDto.type;
    status: VgcIngestionJobDto.status;
    revisionKey: string;
    progress?: number;
    total?: number;
    startedAt?: string;
    completedAt?: string;
    lastError?: string;
    metadata: Record<string, any>;
};
export namespace VgcIngestionJobDto {
    export enum type {
        SMOGON_SNAPSHOT = 'smogon_snapshot',
        CHAMPIONS_REGULATION = 'champions_regulation',
        LIMITLESS_TOURNAMENT = 'limitless_tournament',
    }
    export enum status {
        IDLE = 'idle',
        QUEUED = 'queued',
        RUNNING = 'running',
        DONE = 'done',
        ERROR = 'error',
    }
}

