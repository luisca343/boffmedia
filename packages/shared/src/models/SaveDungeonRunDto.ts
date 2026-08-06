/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DungeonRunParticipantDto } from './DungeonRunParticipantDto';
export type SaveDungeonRunDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Layout seed of the run
     */
    semilla: string;
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
     * Curse ids active during the run
     */
    maldiciones: Array<string>;
    /**
     * Coins the party earned
     */
    monedasGanadas: number;
    /**
     * Coins the party spent
     */
    monedasGastadas: number;
    /**
     * Coins cashed out to ₽
     */
    monedasConvertidas: number;
    /**
     * Run end timestamp (epoch millis)
     */
    fecha: number;
    /**
     * Party members
     */
    participantes: Array<DungeonRunParticipantDto>;
};

