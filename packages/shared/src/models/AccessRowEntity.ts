/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccessRowEntity = {
    userId: number;
    username: string;
    email: string;
    source: AccessRowEntity.source;
    sourceRef?: Record<string, any> | null;
    grantedAt: string;
};
export namespace AccessRowEntity {
    export enum source {
        ADMIN = 'admin',
        INVITE = 'invite',
    }
}

