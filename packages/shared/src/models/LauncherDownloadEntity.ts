/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LauncherDownloadEntity = {
    target: string;
    version: string;
    artifactName: string;
    /**
     * URL absoluta de descarga directa
     */
    url: string;
    /**
     * SHA-512 en hex, calculado por el servidor
     */
    sha512: string;
    sizeBytes: number;
    /**
     * Notas de versión (markdown)
     */
    notes?: string | null;
    /**
     * RFC 3339
     */
    publishedAt: string;
};

