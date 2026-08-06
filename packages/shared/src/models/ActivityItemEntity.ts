/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ActivityItemEntity = {
    type: ActivityItemEntity.type;
    /**
     * Actor nickname
     */
    actor: string;
    /**
     * Achievement or event name
     */
    name: string;
    icon: string;
    at: string;
};
export namespace ActivityItemEntity {
    export enum type {
        ACHIEVEMENT = 'achievement',
        EVENT_JOIN = 'event_join',
    }
}

