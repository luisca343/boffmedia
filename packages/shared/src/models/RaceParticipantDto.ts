/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RaceParticipantDto = {
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Player name at the time of the race
     */
    nombre: string;
    /**
     * Finishing position; a retired racer keeps the position they would have held
     */
    posicion: number;
    /**
     * Total race time in milliseconds; -1 when they never finished
     */
    tiempoMs: number;
    /**
     * Best lap in milliseconds; -1 when they completed no lap
     */
    mejorVueltaMs: number;
    /**
     * Laps actually driven
     */
    vueltasCompletadas: number;
    /**
     * Whether this racer did not finish
     */
    dnf: boolean;
};

