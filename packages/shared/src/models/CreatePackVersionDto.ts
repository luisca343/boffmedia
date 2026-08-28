/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreatePackVersionDto = {
    name: string;
    minecraft?: string;
    loader?: CreatePackVersionDto.loader;
    loaderVersion?: string;
    notes?: string;
    /**
     * PackFile[] — validado con @boffmedia/pack-schema, el mismo esquema del que la app genera sus tipos de Rust
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
    /**
     * OptionalGroup[] — el contenido opcional que el jugador elige, validado con @boffmedia/pack-schema. La unidad es una FEATURE (varios archivos, una decisión), no un archivo suelto.
     */
    optionalGroups?: Array<Record<string, any>>;
    /**
     * PackRuntime — { memoryMib?, jvmArgs? }: la memoria y los parámetros de JVM que esta versión RECOMIENDA. Solo Minecraft. Cada parámetro se valida contra la lista permitida de @boffmedia/pack-schema: se rechazan -Xmx (usa memoryMib; el valor resuelto se añade el último y ganaría) y todo lo que pueda ejecutar un comando o cargar código sin verificar (-javaagent, -XX:OnError, …). Es una recomendación: el lanzador la usa para inicializar una instancia nueva y no la vuelve a aplicar, así que editarla no re-configura a quien ya tiene el pack.
     */
    runtime?: Record<string, any>;
};
export namespace CreatePackVersionDto {
    export enum loader {
        FORGE = 'forge',
        NEOFORGE = 'neoforge',
        FABRIC_LOADER = 'fabric-loader',
        QUILT_LOADER = 'quilt-loader',
    }
}

