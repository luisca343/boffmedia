/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type KartRankingEntry = {
    /**
     * Rank position
     */
    rank: number;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Most recent name seen for this player
     */
    nombre: string;
    /**
     * Circuit the time was set on
     */
    circuito: string;
    /**
     * Best full-distance time in milliseconds
     */
    tiempoMs: number;
    /**
     * Best lap seen for this player on this circuit; null if none recorded
     */
    mejorVueltaMs: number | null;
    /**
     * Laps the race was set to
     */
    vueltas: number;
    /**
     * When the time was set
     */
    fecha: string;
};

