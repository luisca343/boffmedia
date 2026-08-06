/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateParcelaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    zonaId?: number | null;
    status?: string;
    taxAmount?: number;
    taxDueAt?: string;
    notes?: string;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};

