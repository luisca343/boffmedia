/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DungeonBestRun } from './DungeonBestRun';
export type DungeonPlayerStats = {
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
     * Runs played
     */
    partidas: number;
    /**
     * Runs completed
     */
    completadas: number;
    /**
     * Highest stage reached
     */
    mejorEtapa: number;
    /**
     * Most floors cleared in a run
     */
    mejorPisos: number;
    /**
     * Fastest completed run in milliseconds; null if never completed
     */
    mejorTiempoMs: number | null;
    /**
     * Total deaths
     */
    muertes: number;
    /**
     * Runs abandoned
     */
    abandonos: number;
    /**
     * The run this player is ranked on; null if they have never played
     */
    mejorPartida: DungeonBestRun | null;
};

