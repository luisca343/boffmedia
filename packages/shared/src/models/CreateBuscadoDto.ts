/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateBuscadoDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    playerUuid: string;
    severity: CreateBuscadoDto.severity;
    bounty?: number;
    offense: string;
    reportedBy: string;
    lastSeen?: string;
    notes?: string;
};
export namespace CreateBuscadoDto {
    export enum severity {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        CRITICAL = 'critical',
    }
}

