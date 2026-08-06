/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModDependencyEntity } from './ModDependencyEntity';
export type ModFileEntity = {
    platform: ModFileEntity.platform;
    fileId: string;
    /**
     * Solo Modrinth
     */
    versionNumber?: string;
    displayName: string;
    fileName: string;
    fileSize: number;
    gameVersions: Array<string>;
    releaseType: ModFileEntity.releaseType;
    /**
     * ISO-8601
     */
    datePublished: string;
    sha512?: Record<string, any> | null;
    downloadable: boolean;
    loaders: Array<string>;
    dependencies: Array<ModDependencyEntity>;
};
export namespace ModFileEntity {
    export enum platform {
        CURSEFORGE = 'curseforge',
        MODRINTH = 'modrinth',
    }
    export enum releaseType {
        RELEASE = 'release',
        BETA = 'beta',
        ALPHA = 'alpha',
    }
}

