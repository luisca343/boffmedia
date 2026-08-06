/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateExpedienteDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    title: string;
    subjectUuid: string;
    dep?: string;
    severity?: CreateExpedienteDto.severity;
    leadUuid: string;
};
export namespace CreateExpedienteDto {
    export enum severity {
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        CRITICAL = 'critical',
    }
}

