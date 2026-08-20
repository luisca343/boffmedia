/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DesktopVersionEntity = {
    id: string;
    name: string;
    minecraft?: Record<string, any> | null;
    loader?: Record<string, any> | null;
    loaderVersion?: Record<string, any> | null;
    fileCount: number;
    worldCount: number;
    emulatorKind?: DesktopVersionEntity.emulatorKind | null;
    createdAt: string;
};
export namespace DesktopVersionEntity {
    export enum emulatorKind {
        MGBA = 'mgba',
        MELONDS = 'melonds',
    }
}

