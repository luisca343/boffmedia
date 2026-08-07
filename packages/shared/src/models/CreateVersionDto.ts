/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateVersionDto = {
    name: string;
    minecraft?: string;
    loader?: CreateVersionDto.loader;
    loaderVersion?: string;
    notes?: string;
    /**
     * PackFile[] — validado con @boffmedia/pack-schema, el mismo esquema del que el launcher genera sus tipos de Rust
     */
    files: Array<Record<string, any>>;
    /**
     * BundledWorld[] — validado con @boffmedia/pack-schema (solo minecraft)
     */
    worlds?: Array<Record<string, any>>;
    emulator?: Record<string, any>;
    zomboid?: Record<string, any>;
    stardew?: Record<string, any>;
    /**
     * PackFile[] instalados solo en la primera instalación (initialFiles) — validado con @boffmedia/pack-schema
     */
    initialFiles?: Array<Record<string, any>>;
};
export namespace CreateVersionDto {
    export enum loader {
        FORGE = 'forge',
        NEOFORGE = 'neoforge',
        FABRIC_LOADER = 'fabric-loader',
        QUILT_LOADER = 'quilt-loader',
    }
}

