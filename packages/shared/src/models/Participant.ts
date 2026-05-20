/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Participant = {
    /**
     * Unique identifier for the participant
     */
    id: number;
    /**
     * Event ID
     */
    eventId: number;
    /**
     * Participant ID
     */
    participantId: number;
    /**
     * User ID
     */
    userId: number;
    /**
     * User avatar URL
     */
    avatar?: string;
    /**
     * Participant nickname in the event
     */
    nickname?: string;
    /**
     * Participant status
     */
    status: Participant.status;
    /**
     * Comment from participant
     */
    comment?: string;
    /**
     * When the participant was created
     */
    createdAt: string;
    /**
     * When the participant was last updated
     */
    updatedAt: string;
};
export namespace Participant {
    /**
     * Participant status
     */
    export enum status {
        REGISTERED = 'registered',
        CONFIRMED = 'confirmed',
        DECLINED = 'declined',
        REMOVED = 'removed',
    }
}

