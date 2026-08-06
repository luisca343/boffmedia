/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DungeonBestRun = {
    /**
     * Stage the party started on
     */
    etapaInicial: number;
    /**
     * Stage the party reached
     */
    etapaFinal: number;
    /**
     * Floors cleared
     */
    pisosSuperados: number;
    /**
     * Whether the run was completed
     */
    completada: boolean;
    /**
     * Run duration in milliseconds
     */
    duracionMs: number;
    /**
     * Curses active during the run
     */
    maldiciones: Array<string>;
    /**
     * Run end timestamp
     */
    fecha: string;
};

