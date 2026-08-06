/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventoWeightsDto } from './EventoWeightsDto';
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoEventoEntity = {
    id: number;
    code: string;
    type: GobiernoEventoEntity.type;
    status: string;
    title: string;
    brief?: Record<string, any> | null;
    prize?: Record<string, any> | null;
    crew?: Record<string, any> | null;
    buildClosedAt?: Record<string, any> | null;
    ratingOpensAt?: Record<string, any> | null;
    ratingClosesAt?: Record<string, any> | null;
    winnerTown?: Record<string, any> | null;
    zone?: Record<string, any> | null;
    coordsX?: number | null;
    coordsZ?: number | null;
    radius?: number | null;
    opensAt?: Record<string, any> | null;
    closesAt?: Record<string, any> | null;
    rules?: Record<string, any> | null;
    weights?: EventoWeightsDto | null;
    createdBy: PersonRefEntity;
    createdAt: string;
    updatedAt: string;
};
export namespace GobiernoEventoEntity {
    export enum type {
        CONSTRUCCION = 'construccion',
        CAZA = 'caza',
    }
}

