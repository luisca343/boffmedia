/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopListingEntity } from './WigglypopListingEntity';
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopOfferEntity = {
    id: number;
    listingId: number;
    buyer: WigglypopPersonRef;
    amount: number;
    qty: number;
    status: string;
    createdAt: string;
    respondedAt?: Record<string, any> | null;
    listing?: WigglypopListingEntity;
    /**
     * Set when accepting an offer created the order
     */
    orderId?: Record<string, any> | null;
};

