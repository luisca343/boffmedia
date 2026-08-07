/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LauncherVersionEntity = {
    id: string;
    name: string;
    minecraft?: Record<string, any> | null;
    loader?: Record<string, any> | null;
    loaderVersion?: Record<string, any> | null;
    fileCount: number;
    worldCount: number;
    emulatorKind?: LauncherVersionEntity.emulatorKind | null;
    createdAt: string;
};
export namespace LauncherVersionEntity {
    export enum emulatorKind {
        MGBA = 'mgba',
        MELONDS = 'melonds',
    }
}

