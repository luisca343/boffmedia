/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ModDependencyEntity = {
    platform: ModDependencyEntity.platform;
    projectId: string;
    relation: ModDependencyEntity.relation;
    /**
     * Versión concreta exigida, si la hay
     */
    versionId?: string;
    name?: string;
    slug?: string;
    iconUrl?: string;
};
export namespace ModDependencyEntity {
    export enum platform {
        CURSEFORGE = 'curseforge',
        MODRINTH = 'modrinth',
    }
    export enum relation {
        REQUIRED = 'required',
        OPTIONAL = 'optional',
        INCOMPATIBLE = 'incompatible',
        EMBEDDED = 'embedded',
    }
}

