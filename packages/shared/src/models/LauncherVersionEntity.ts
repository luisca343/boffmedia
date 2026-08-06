/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LauncherVersionEntity = {
    id: string;
    name: string;
    /**
     * Null para packs que no son de Minecraft
     */
    minecraft?: Record<string, any> | null;
    loader?: Record<string, any> | null;
    loaderVersion?: Record<string, any> | null;
    fileCount: number;
    worldCount: number;
    createdAt: string;
};

