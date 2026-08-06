/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WigglypopPersonRef } from './WigglypopPersonRef';
export type WigglypopReviewEntity = {
    id: number;
    orderId: number;
    reviewer: WigglypopPersonRef;
    rating: number;
    body?: Record<string, any> | null;
    createdAt: string;
};

