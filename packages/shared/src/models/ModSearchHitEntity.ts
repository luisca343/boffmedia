/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ModSearchHitEntity = {
    platform: ModSearchHitEntity.platform;
    projectId: string;
    slug: string;
    name: string;
    summary: string;
    iconUrl?: string;
    downloads: number;
    author?: string;
    categories: Array<string>;
    /**
     * ISO-8601
     */
    updatedAt?: string;
    clientSide?: ModSearchHitEntity.clientSide;
    serverSide?: ModSearchHitEntity.serverSide;
};
export namespace ModSearchHitEntity {
    export enum platform {
        CURSEFORGE = 'curseforge',
        MODRINTH = 'modrinth',
    }
    export enum clientSide {
        REQUIRED = 'required',
        OPTIONAL = 'optional',
        UNSUPPORTED = 'unsupported',
        UNKNOWN = 'unknown',
    }
    export enum serverSide {
        REQUIRED = 'required',
        OPTIONAL = 'optional',
        UNSUPPORTED = 'unsupported',
        UNKNOWN = 'unknown',
    }
}

