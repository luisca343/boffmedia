/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { KartCircuitBest } from './KartCircuitBest';
export type KartPlayerStats = {
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Most recent name seen for this player
     */
    nombre: string;
    /**
     * Races entered
     */
    carreras: number;
    /**
     * Races won
     */
    victorias: number;
    /**
     * Top-three finishes
     */
    podios: number;
    /**
     * Races retired from
     */
    abandonos: number;
    /**
     * Per-circuit bests
     */
    circuitos: Array<KartCircuitBest>;
};

