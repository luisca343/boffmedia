/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaceParticipantDto } from './RaceParticipantDto';
export type SaveRaceDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Circuit name
     */
    circuito: string;
    /**
     * Race mode id from the mod
     */
    modo: string;
    /**
     * Laps the race was set to
     */
    vueltas: number;
    /**
     * Race end timestamp (epoch millis)
     */
    fecha: number;
    /**
     * The grid
     */
    participantes: Array<RaceParticipantDto>;
};

