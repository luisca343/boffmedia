/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateParcelaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * The exact WorldGuard region id
     */
    regionId: string;
    town: string;
    number: number;
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

