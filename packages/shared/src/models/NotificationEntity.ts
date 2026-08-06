/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NotificationEntity = {
    id: number;
    userId: number;
    type: NotificationEntity.type;
    title: string;
    body: Record<string, any> | null;
    link: Record<string, any> | null;
    readAt: string | null;
    createdAt: string;
};
export namespace NotificationEntity {
    export enum type {
        EVENT = 'event',
        ACHIEVEMENT = 'achievement',
        TOURNAMENT = 'tournament',
        FORUM = 'forum',
        SYSTEM = 'system',
    }
}

