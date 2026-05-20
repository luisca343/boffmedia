/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TcgCard } from './TcgCard';
export type SeriesCardsGroup = {
    /**
     * Set ID
     */
    setId: string;
    /**
     * Set name (localized)
     */
    setName: string;
    /**
     * Number of cards in this set
     */
    cardCount: number;
    /**
     * Cards in this set
     */
    cards: Array<TcgCard>;
};

