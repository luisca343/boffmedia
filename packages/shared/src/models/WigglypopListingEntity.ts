/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopListingItemEntity } from './WigglypopListingItemEntity';
import type { WigglypopListingMonEntity } from './WigglypopListingMonEntity';
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopListingEntity = {
    id: number;
    code: string;
    seller: WigglypopPersonRef;
    kind: string;
    format: string;
    title: string;
    note?: Record<string, any> | null;
    status: string;
    price: number;
    /**
     * The tasación. Never used to charge anybody.
     */
    value: number;
    escrow: boolean;
    views: number;
    /**
     * How many players have this listing on their watchlist
     */
    watchers: number;
    /**
     * Pending offers on this listing (status = pendiente)
     */
    offers: number;
    mons: Array<WigglypopListingMonEntity>;
    items: Array<WigglypopListingItemEntity>;
    startsAt?: Record<string, any> | null;
    endsAt?: Record<string, any> | null;
    currentBid: number;
    bids: number;
    minIncrement: number;
    buyNow?: Record<string, any> | null;
    wants?: Array<string> | null;
    tradePlus: boolean;
    soldAt?: Record<string, any> | null;
    soldFor?: Record<string, any> | null;
    soldOrderId?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
};

