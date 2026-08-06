/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListingItemInputDto } from './ListingItemInputDto';
export type ValuateDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    dex?: number;
    level?: number;
    /**
     * Six IVs (HP, Atk, Def, SpA, SpD, Spe)
     */
    ivs?: Array<number>;
    shiny?: boolean;
    legendary?: boolean;
    heldItem?: string;
    /**
     * Valuing items instead of a mon: sum of catalog ref_price × qty
     */
    items?: Array<ListingItemInputDto>;
};

