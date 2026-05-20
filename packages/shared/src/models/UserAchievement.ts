/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserAchievement = {
    /**
     * Unique identifier for the achievement
     */
    id: string;
    /**
     * Achievement name
     */
    name: string;
    /**
     * Achievement description
     */
    description: string;
    /**
     * Achievement icon path
     */
    icon: string;
    /**
     * Achievement category
     */
    category: string;
    /**
     * Achievement subcategory
     */
    subcategory: string;
    /**
     * Target value to complete the achievement
     */
    target: number;
    /**
     * Display order
     */
    order: number;
    /**
     * Battle/Data ID associated with this achievement
     */
    battleId: number;
    /**
     * Current progress towards the achievement
     */
    progress: number;
    /**
     * Completion status (0 = not completed, 1 = completed)
     */
    completed: number;
    /**
     * When the achievement was completed
     */
    completedAt: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Team data used for the achievement
     */
    team: string;
    /**
     * Battle replay data
     */
    replay: string;
};

