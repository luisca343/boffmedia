/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ResolvedFileEntity = {
    /**
     * 128 hex — calculado por el servidor
     */
    sha512: string;
    fileSize: number;
    fileName: string;
    /**
     * El FileSource listo para el manifiesto
     */
    source: Record<string, any>;
};

