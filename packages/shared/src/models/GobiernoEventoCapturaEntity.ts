/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoEventoCapturaEntity = {
    id: number;
    eventoId: number;
    player: PersonRefEntity;
    species: string;
    level: number;
    ivsTotal: number;
    shiny: boolean;
    size?: number | null;
    score: number;
    createdAt: string;
    updatedAt: string;
};

