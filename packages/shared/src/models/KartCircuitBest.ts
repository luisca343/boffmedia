/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type KartCircuitBest = {
    /**
     * Circuit name
     */
    circuito: string;
    /**
     * Races run on this circuit
     */
    carreras: number;
    /**
     * Best full-distance clasica time in milliseconds; null if never set one
     */
    mejorTiempoMs: number | null;
    /**
     * Best lap in milliseconds; null if no lap was ever completed
     */
    mejorVueltaMs: number | null;
};

