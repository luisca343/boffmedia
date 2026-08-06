/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopPersonRef } from './WigglypopPersonRef';
import type { WigglypopReviewEntity } from './WigglypopReviewEntity';
export type WigglypopSellerEntity = {
    seller: WigglypopPersonRef;
    /**
     * Mean of real reviews, 1 decimal. null when there are none.
     */
    rating: number | null;
    /**
     * Count of completed order lines
     */
    sales: number;
    reviewCount: number;
    /**
     * Listings currently activo
     */
    activeListings: number;
    reviews: Array<WigglypopReviewEntity>;
};

