/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateBuscadoDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    severity?: UpdateBuscadoDto.severity;
    bounty?: number;
    offense?: string;
    lastSeen?: string;
    notes?: string;
};
export namespace UpdateBuscadoDto {
    export enum severity {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        CRITICAL = 'critical',
    }
}

