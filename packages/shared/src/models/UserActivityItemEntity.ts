/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserActivityItemEntity = {
    /**
     * Type of activity entry
     */
    type: UserActivityItemEntity.type;
    /**
     * Achievement or event name
     */
    name: string;
    /**
     * Icon for this activity
     */
    icon: string;
    /**
     * Points earned (achievements only)
     */
    points: number | null;
    /**
     * Timestamp of the activity
     */
    at: string;
};
export namespace UserActivityItemEntity {
    /**
     * Type of activity entry
     */
    export enum type {
        ACHIEVEMENT = 'achievement',
        EVENT_JOIN = 'event_join',
    }
}

