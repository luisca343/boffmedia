/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoEventoObraEntity = {
    id: number;
    eventoId: number;
    town: string;
    buildName: string;
    description?: Record<string, any> | null;
    builders: Array<PersonRefEntity>;
    createdAt: string;
    /**
     * Average diseño (0-10), derived from votos
     */
    diseno: number;
    /**
     * Average ambición (0-10), derived from votos
     */
    ambicion: number;
    /**
     * Average fidelidad (0-10), derived from votos
     */
    fidelidad: number;
    /**
     * Number of votes cast
     */
    votes: number;
};

