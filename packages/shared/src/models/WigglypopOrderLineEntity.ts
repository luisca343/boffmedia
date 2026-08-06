/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopListingEntity } from './WigglypopListingEntity';
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopOrderLineEntity = {
    id: number;
    listingId: number;
    seller: WigglypopPersonRef;
    kind: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    /**
     * pendiente → transferido → confirmado (manual custody), or straight to confirmado (atomic)
     */
    deliveryStatus: string;
    settleTxId?: Record<string, any> | null;
    confirmedAt?: Record<string, any> | null;
    /**
     * The listing this line bought, as it stood
     */
    listing?: WigglypopListingEntity;
};

