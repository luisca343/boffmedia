/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParticipanteCarreraDto } from './ParticipanteCarreraDto';
export type ResultadoCarreraDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    fecha: number;
    circuito: string;
    participantes: Array<ParticipanteCarreraDto>;
};

