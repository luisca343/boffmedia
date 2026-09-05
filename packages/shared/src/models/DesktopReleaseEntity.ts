/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DesktopReleaseEntity = {
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
    /**
     * Porcentaje de clientes (0-100) que reciben esta versión. Los clientes se asignan a grupos determinísticamente por su device ID.
     */
    rolloutPercent: number;
    /**
     * Pausa la distribución incluso si está publicada. Útil para pausas de emergencia sin despublicar.
     */
    paused: boolean;
    createdAt: string;
};

