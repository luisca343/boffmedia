/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GobiernoPujaEntity } from './GobiernoPujaEntity';
import type { PersonRefEntity } from './PersonRefEntity';
export type GobiernoSubastaEntity = {
    id: number;
    code: string;
    regionId: string;
    town: string;
    number: number;
    startBid: number;
    currentBid: number;
    bidder?: PersonRefEntity | null;
    bids: number;
    reason?: Record<string, any> | null;
    status: string;
    endsAt: string;
    settledTxId?: number | null;
    createdBy: PersonRefEntity;
    createdAt: string;
    updatedAt: string;
    /**
     * Most recent bids for this auction (last 20)
     */
    recentBids?: Array<GobiernoPujaEntity>;
};

