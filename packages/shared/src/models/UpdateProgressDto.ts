/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateProgressDto = {
    /**
     * The ID of the participant
     */
    participantId: number;
    /**
     * The ID of the achievement
     */
    achievementId: number;
    /**
     * The progress amount to add
     */
    progress: number;
    /**
     * The team ID if this is team progress
     */
    teamId?: number;
};

