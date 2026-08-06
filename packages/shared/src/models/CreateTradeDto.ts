/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListingMonInputDto } from './ListingMonInputDto';
export type CreateTradeDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    listingId: number;
    proposerUuid: string;
    /**
     * The offered mon, verified against the proposer's live PC
     */
    offered: ListingMonInputDto;
};

