/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Event = {
    /**
     * Unique identifier for the event
     */
    id: number;
    /**
     * Parent event ID if this is a sub-event
     */
    parentId?: number;
    /**
     * Title of the event
     */
    title: string;
    /**
     * Description of the event
     */
    description: string;
    /**
     * Game ID this event is for
     */
    gameId: number;
    /**
     * Event icon URL
     */
    icon: string;
    /**
     * Event banner URL
     */
    banner?: string;
    /**
     * Event start date
     */
    startDate: string;
    /**
     * Event end date
     */
    endDate?: string;
    /**
     * Event status
     */
    status: Event.status;
    /**
     * Event visibility
     */
    visibility: Event.visibility;
    /**
     * Event type
     */
    type: Event.type;
    /**
     * Game name
     */
    gameName?: string;
    /**
     * Name of the parent event
     */
    parentEventName?: string;
    /**
     * When the event was created
     */
    createdAt: string;
    /**
     * When the event was last updated
     */
    updatedAt: string;
    /**
     * When the event was deleted
     */
    deletedAt?: string;
    /**
     * Child events if this is a parent event
     */
    childEvents?: Array<Event>;
};
export namespace Event {
    /**
     * Event status
     */
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        COMPLETED = 'completed',
    }
    /**
     * Event visibility
     */
    export enum visibility {
        PUBLIC = 'public',
        PRIVATE = 'private',
    }
    /**
     * Event type
     */
    export enum type {
        EVENT = 'event',
        SERVER = 'server',
    }
}

