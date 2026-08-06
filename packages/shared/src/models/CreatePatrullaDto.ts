/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePatrullaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    label: string;
    fromTime: string;
    toTime: string;
    zone?: string;
    status?: CreatePatrullaDto.status;
    /**
     * UUIDs of the officers assigned
     */
    officers?: Array<string>;
    /**
     * Officer performing the action, for the audit log
     */
    actorUuid?: string;
};
export namespace CreatePatrullaDto {
    export enum status {
        ACTIVE = 'active',
        REST = 'rest',
    }
}

