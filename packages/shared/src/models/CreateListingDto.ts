/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListingItemInputDto } from './ListingItemInputDto';
import type { ListingMonInputDto } from './ListingMonInputDto';
export type CreateListingDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    sellerUuid: string;
    kind: CreateListingDto.kind;
    format?: CreateListingDto.format;
    /**
     * Defaults to the species name / item name when omitted
     */
    title?: string;
    note?: string;
    /**
     * Asking price. For an auction this is the starting bid.
     */
    price: number;
    /**
     * The single Pokémon, for kind=mon. Equivalent to sending a one-element `mons`.
     */
    mon?: ListingMonInputDto;
    /**
     * The single item stack, for kind=item. Equivalent to sending a one-element `items`.
     */
    item?: ListingItemInputDto;
    /**
     * Several Pokémon, for kind=bundle. Use `mon` for a single one.
     */
    mons?: Array<ListingMonInputDto>;
    items?: Array<ListingItemInputDto>;
    /**
     * Whether the sale settles through the market escrow. Sales always do today.
     */
    escrow?: boolean;
    /**
     * How long an auction runs, in days. Converted to `endsAt` server-side — a client clock must never decide when an auction closes.
     */
    durationDays?: number;
    /**
     * Auction close time (ISO 8601). Prefer `durationDays`.
     */
    endsAt?: string;
    minIncrement?: number;
    /**
     * Auction-only instant-win price
     */
    buyNow?: number;
    wants?: Array<string>;
    tradePlus?: boolean;
};
export namespace CreateListingDto {
    export enum kind {
        MON = 'mon',
        ITEM = 'item',
        ITEMS = 'items',
        BUNDLE = 'bundle',
    }
    export enum format {
        FIXED = 'fixed',
        AUCTION = 'auction',
        OFFER = 'offer',
        TRADE = 'trade',
    }
}

