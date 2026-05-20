/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NotificationResponseDto = {
    /**
     * Notification ID
     */
    id: number;
    /**
     * Recipient user UUID
     */
    userUuid: string;
    /**
     * Notification type (chatapp, starbank, arcade, misiones, …)
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
    /**
     * Whether the notification has been read
     */
    isRead: number;
    /**
     * Creation timestamp
     */
    createdAt: string;
};

