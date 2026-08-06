/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ModProjectEntity = {
    platform: ModProjectEntity.platform;
    projectId: string;
    slug: string;
    name: string;
    summary: string;
    description: string;
    iconUrl?: string;
    downloads: number;
    author?: string;
    categories: Array<string>;
    gameVersions: Array<string>;
    loaders: Array<string>;
    gallery: Array<string>;
    sourceUrl?: string;
    issuesUrl?: string;
    websiteUrl?: string;
    clientSide: ModProjectEntity.clientSide;
    serverSide: ModProjectEntity.serverSide;
};
export namespace ModProjectEntity {
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

