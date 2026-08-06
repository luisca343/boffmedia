/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopListingEntity } from './WigglypopListingEntity';
import type { WigglypopListingMonEntity } from './WigglypopListingMonEntity';
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopTradeOfferEntity = {
    id: number;
    listingId: number;
    proposer: WigglypopPersonRef;
    offeredPokemonKey: string;
    /**
     * Snapshot of the offered mon, taken from the proposer's live PC
     */
    offeredSnapshot?: WigglypopListingMonEntity | null;
    status: string;
    createdAt: string;
    respondedAt?: Record<string, any> | null;
    listing?: WigglypopListingEntity;
};

