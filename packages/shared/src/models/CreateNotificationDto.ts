/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateNotificationDto = {
    /**
     * Target user id. Omit to broadcast to all users.
     */
    userId?: number;
    type: CreateNotificationDto.type;
    title: string;
    body?: string;
    link?: string;
};
export namespace CreateNotificationDto {
    export enum type {
        EVENT = 'event',
        ACHIEVEMENT = 'achievement',
        TOURNAMENT = 'tournament',
        FORUM = 'forum',
        SYSTEM = 'system',
    }
}

