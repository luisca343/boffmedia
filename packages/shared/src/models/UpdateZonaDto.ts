/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateZonaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    town?: string;
    name?: string;
    /**
     * Free-form zone kind
     */
    kind?: string;
    description?: string;
    /**
     * Officer performing the action, for the audit log (zonas has no owner column)
     */
    actorUuid?: string;
};

