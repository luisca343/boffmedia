/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LauncherReleaseEntity = {
    id: number;
    version: string;
    target: string;
    notes?: string | null;
    artifactName: string;
    /**
     * Calculado por el servidor sobre los bytes recibidos
     */
    artifactSha512: string;
    sizeBytes: number;
    /**
     * Solo las publicadas aparecen en el feed
     */
    published: boolean;
    publishedAt?: string | null;
    createdAt: string;
};

