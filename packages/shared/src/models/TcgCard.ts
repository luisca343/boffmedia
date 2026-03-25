/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TcgCardAttack } from './TcgCardAttack';
import type { TcgCardBooster } from './TcgCardBooster';
import type { TcgCardLegal } from './TcgCardLegal';
import type { TcgCardVariants } from './TcgCardVariants';
import type { TcgCardWeakness } from './TcgCardWeakness';
export type TcgCard = {
    /**
     * Card ID
     */
    id: string;
    /**
     * Set ID
     */
    setId: string;
    /**
     * Set name (localized)
     */
    setName: string;
    /**
     * Local ID within set
     */
    localId: string;
    /**
     * Card name
     */
    name: string;
    /**
     * Card image URL
     */
    image?: string;
    /**
     * Card category
     */
    category: string;
    /**
     * Card illustrator
     */
    illustrator?: string;
    /**
     * Card rarity
     */
    rarity: string;
    /**
     * Pokemon HP
     */
    hp?: number;
    /**
     * Pokemon stage
     */
    stage?: string;
    /**
     * Card description
     */
    description?: string;
    /**
     * Last updated timestamp
     */
    updated: string;
    /**
     * Pokemon types
     */
    types?: Array<string>;
    /**
     * Pokemon weaknesses
     */
    weaknesses?: Array<TcgCardWeakness>;
    /**
     * Pokemon attacks
     */
    attacks?: Array<TcgCardAttack>;
    /**
     * Boosters containing this card
     */
    boosters?: Array<TcgCardBooster>;
    /**
     * Card variants
     */
    variants?: TcgCardVariants;
    /**
     * Format legality
     */
    legal?: TcgCardLegal;
    /**
     * Retreat cost
     */
    retreat?: number;
};

