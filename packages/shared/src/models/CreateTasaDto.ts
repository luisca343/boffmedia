/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateTasaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    concept: string;
    /**
     * Free-form rate-card kind
     */
    kind: string;
    /**
     * Human-readable rate
     */
    rate: string;
    amount?: number;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};

