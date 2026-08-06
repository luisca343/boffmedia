/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PackVersionEntity = {
    id: string;
    packId: string;
    name: string;
    /**
     * Null para packs que no son de Minecraft
     */
    minecraft?: Record<string, any> | null;
    loader?: Record<string, any> | null;
    loaderVersion?: Record<string, any> | null;
    /**
     * EmulatorSpec (kind/executable/rom/args) para packs de emulador
     */
    emulator?: Record<string, any>;
    fileCount: number;
    worldCount: number;
    published: boolean;
    notes?: Record<string, any> | null;
    createdAt: string;
};

