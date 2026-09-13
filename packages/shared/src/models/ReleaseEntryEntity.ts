/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReleaseEntryEntity = {
    id: number;
    type: ReleaseEntryEntity.type;
    sortOrder: number;
    title: string;
    description: string;
    locale: ReleaseEntryEntity.locale;
};
export namespace ReleaseEntryEntity {
    export enum type {
        NEW = 'new',
        IMPROVEMENT = 'improvement',
        FIX = 'fix',
        SECURITY = 'security',
        DEPRECATED = 'deprecated',
        REMOVED = 'removed',
    }
    export enum locale {
        EN = 'en',
        ES = 'es',
    }
}

