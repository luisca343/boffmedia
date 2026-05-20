/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAchievementDto = {
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
    itemType?: CreateAchievementDto.itemType;
    /**
     * Category of the achievement
     */
    category?: CreateAchievementDto.category;
    /**
     * Rarity of the achievement
     */
    rarity?: CreateAchievementDto.rarity;
    /**
     * Display order
     */
    order?: number;
    /**
     * Whether the achievement is active
     */
    active?: number;
};
export namespace CreateAchievementDto {
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

