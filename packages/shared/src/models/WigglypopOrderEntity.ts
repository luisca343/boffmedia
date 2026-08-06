/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopOrderLineEntity } from './WigglypopOrderLineEntity';
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopOrderEntity = {
    id: number;
    code: string;
    buyer: WigglypopPersonRef;
    subtotal: number;
    /**
     * House fee, kept by the escrow account
     */
    fee: number;
    total: number;
    /**
     * escrow → transferido → completado, or cancelado
     */
    status: string;
    /**
     * The real StarBank buyer → escrow transfer. Not a bookkeeping row.
     */
    escrowTxId?: Record<string, any> | null;
    lines: Array<WigglypopOrderLineEntity>;
    createdAt: string;
    updatedAt: string;
};

