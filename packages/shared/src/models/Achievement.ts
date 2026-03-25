/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Achievement = {
    /**
     * Unique identifier for the achievement
     */
    id: number;
    /**
     * Event ID this achievement belongs to
     */
    eventId: number;
    /**
     * Name of the achievement
     */
    name: string;
    /**
     * Description of the achievement
     */
    description: string;
    /**
     * Icon path for the achievement
     */
    icon: string;
    /**
     * Points awarded for this achievement
     */
    points: number;
    /**
     * Maximum progress needed to complete achievement
     */
    maxProgress: number;
    /**
     * Type of item
     */
    itemType?: Achievement.itemType;
    /**
     * Category of the achievement
     */
    category?: Achievement.category;
    /**
     * Rarity of the achievement
     */
    rarity?: Achievement.rarity;
    /**
     * Display order
     */
    order?: number;
    /**
     * Whether the achievement is active
     */
    active?: number;
    /**
     * Name of the event this achievement belongs to
     */
    eventName?: string;
    /**
     * When the achievement was created
     */
    createdAt: string;
    /**
     * When the achievement was last updated
     */
    updatedAt: string;
    /**
     * When the achievement was deleted
     */
    deletedAt?: string;
};
export namespace Achievement {
    /**
     * Type of item
     */
    export enum itemType {
        ACHIEVEMENT = 'achievement',
        MEDAL = 'medal',
    }
    /**
     * Category of the achievement
     */
    export enum category {
        COMPETITION = 'competition',
        CHALLENGE = 'challenge',
        PARTICIPATION = 'participation',
        ACHIEVEMENT = 'achievement',
    }
    /**
     * Rarity of the achievement
     */
    export enum rarity {
        BRONZE = 'bronze',
        SILVER = 'silver',
        GOLD = 'gold',
        PLATINUM = 'platinum',
        DIAMOND = 'diamond',
    }
}

