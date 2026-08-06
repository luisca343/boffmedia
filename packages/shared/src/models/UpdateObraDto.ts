/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateObraDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    town?: string;
    buildName?: string;
    description?: string;
    /**
     * UUIDs of the builders
     */
    builders?: Array<string>;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};

