/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserTrophyEntity = {
    /**
     * Achievement/medal ID
     */
    id: number;
    /**
     * Trophy name
     */
    name: string;
    /**
     * Trophy description
     */
    description: string | null;
    /**
     * Trophy icon
     */
    icon: string;
    /**
     * Points awarded for this trophy
     */
    points: number;
    /**
     * Trophy rarity
     */
    rarity: string | null;
    /**
     * Whether this is an achievement or a medal
     */
    itemType: UserTrophyEntity.itemType;
    /**
     * Trophy category
     */
    category: string;
    /**
     * Whether the user has earned this trophy
     */
    earned: boolean;
    /**
     * When the user completed this trophy, if earned
     */
    completedAt: string | null;
};
export namespace UserTrophyEntity {
    /**
     * Whether this is an achievement or a medal
     */
    export enum itemType {
        ACHIEVEMENT = 'achievement',
        MEDAL = 'medal',
    }
}

