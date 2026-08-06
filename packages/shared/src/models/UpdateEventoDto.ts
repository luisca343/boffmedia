/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventoWeightsDto } from './EventoWeightsDto';
export type UpdateEventoDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    title?: string;
    brief?: string;
    prize?: string;
    crew?: string;
    /**
     * construcción: when submissions close
     */
    buildClosedAt?: string;
    /**
     * construcción: when public rating opens
     */
    ratingOpensAt?: string;
    /**
     * construcción: when public rating closes
     */
    ratingClosesAt?: string;
    /**
     * caza: hunting zone
     */
    zone?: string;
    /**
     * caza: center X
     */
    coordsX?: number;
    /**
     * caza: center Z
     */
    coordsZ?: number;
    /**
     * caza: radius in blocks
     */
    radius?: number;
    /**
     * caza: when the hunt opens
     */
    opensAt?: string;
    /**
     * caza: when the hunt closes
     */
    closesAt?: string;
    rules?: string;
    /**
     * caza: public scoring weights
     */
    weights?: EventoWeightsDto;
    status?: UpdateEventoDto.status;
    /**
     * construcción: winning town
     */
    winnerTown?: string;
};
export namespace UpdateEventoDto {
    export enum status {
        UPCOMING = 'upcoming',
        LIVE = 'live',
        CLOSED = 'closed',
    }
}

