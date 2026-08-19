/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateEventAchievementDto = {
    /**
     * The name of the achievement
     */
    name?: string;
    /**
     * The description of the achievement
     */
    description?: string;
    /**
     * The icon path
     */
    icon?: string;
    /**
     * Points awarded for this achievement
     */
    points?: number;
    /**
     * Maximum progress needed to complete achievement
     */
    maxProgress?: number;
    /**
     * Type of item
     */
    itemType?: UpdateEventAchievementDto.itemType;
    /**
     * Category of the achievement
     */
    category?: UpdateEventAchievementDto.category;
    /**
     * Rarity of the achievement
     */
    rarity?: UpdateEventAchievementDto.rarity;
    /**
     * Display order
     */
    order?: number;
};
export namespace UpdateEventAchievementDto {
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

