/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateExpedienteDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    title?: string;
    dep?: string;
    severity?: UpdateExpedienteDto.severity;
    leadUuid?: string;
    status?: UpdateExpedienteDto.status;
};
export namespace UpdateExpedienteDto {
    export enum severity {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        CRITICAL = 'critical',
    }
    export enum status {
        OPEN = 'open',
        CLOSED = 'closed',
    }
}

