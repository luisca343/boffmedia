/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateEventAchievementDto = {
    /**
     * The name of the achievement
     */
    name: string;
    /**
     * The description of the achievement
     */
    description: string;
    /**
     * The icon path
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
    itemType: CreateEventAchievementDto.itemType;
    /**
     * Category of the achievement
     */
    category: CreateEventAchievementDto.category;
    /**
     * Rarity of the achievement
     */
    rarity?: CreateEventAchievementDto.rarity;
    /**
     * Display order
     */
    order?: number;
    /**
     * Whether the achievement is active
     */
    active?: number;
};
export namespace CreateEventAchievementDto {
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

