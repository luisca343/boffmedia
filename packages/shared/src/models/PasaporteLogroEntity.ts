/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PasaporteLogroEntity = {
    id: string;
    name: string;
    description: string;
    icon?: string | null;
    category: string;
    subcategory?: string | null;
    target: number;
    order: number;
    /**
     * 0 when the trainer never touched it.
     */
    progress: number;
    completed: boolean;
    completedAt?: string | null;
    /**
     * Curated by category — see the seed.
     */
    points: number;
    tier: PasaporteLogroEntity.tier;
    /**
     * REAL rarity: % of players who completed it (distinct completers / distinct players), rounded, floored at 1. 100 when nobody plays yet.
     */
    rarity: number;
};
export namespace PasaporteLogroEntity {
    export enum tier {
        BRONCE = 'bronce',
        PLATA = 'plata',
        ORO = 'oro',
        PLATINO = 'platino',
    }
}

