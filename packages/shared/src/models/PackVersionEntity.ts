/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PackVersionEntity = {
    id: string;
    packId: string;
    name: string;
    minecraft?: Record<string, any> | null;
    loader?: Record<string, any> | null;
    loaderVersion?: Record<string, any> | null;
    fileCount: number;
    worldCount: number;
    emulatorKind?: PackVersionEntity.emulatorKind | null;
    published: boolean;
    notes?: Record<string, any> | null;
    createdAt: string;
};
export namespace PackVersionEntity {
    export enum emulatorKind {
        MGBA = 'mgba',
        MELONDS = 'melonds',
    }
}

