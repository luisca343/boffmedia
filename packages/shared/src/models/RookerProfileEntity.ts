/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RookerProfileCountsEntity } from './RookerProfileCountsEntity';
import type { RookerTrainerStatsEntity } from './RookerTrainerStatsEntity';
export type RookerProfileEntity = {
    uuid: string;
    username: string;
    handle: string;
    displayName?: Record<string, any> | null;
    bio?: Record<string, any> | null;
    link?: Record<string, any> | null;
    partnerPokemonId?: Record<string, any> | null;
    createdAt?: Record<string, any> | null;
    counts: RookerProfileCountsEntity;
    stats: RookerTrainerStatsEntity;
    isFollowedByMe: boolean;
};

