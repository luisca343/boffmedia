/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventModules } from './EventModules';
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
     * Pack this event grants access to. Membership in the event is the entitlement.
     */
    packId?: string | null;
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
    /**
     * Optional modules present on this event. Only populated by the single-event endpoint — the list endpoint omits it.
     */
    modules?: EventModules;
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

