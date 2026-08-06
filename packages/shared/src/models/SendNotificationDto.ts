/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SendNotificationDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Recipient user UUID
     */
    userUuid: string;
    /**
     * Notification type (chatapp, starbank, system, …)
     */
    type: string;
    /**
     * Short notification title
     */
    title: string;
    /**
     * Notification body text
     */
    body: string;
    /**
     * Optional deep-link URL
     */
    link?: string | null;
};

