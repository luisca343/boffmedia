/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateEventDto = {
    /**
     * The ID of the parent event, if any
     */
    parentId?: number;
    /**
     * The title of the event
     */
    title: string;
    /**
     * The description of the event
     */
    description: string;
    /**
     * The game ID
     */
    gameId: number;
    /**
     * The start date of the event. Optional: an event can be created undated and dated later.
     */
    startDate?: string | null;
    /**
     * The end date of the event
     */
    endDate?: string;
    /**
     * The visibility of the event
     */
    visibility: CreateEventDto.visibility;
    /**
     * The type of event
     */
    type: CreateEventDto.type;
    /**
     * The icon of the event
     */
    icon: string;
    /**
     * The banner of the event
     */
    banner?: string;
    /**
     * Lifecycle status. Owned by the events module — the randomizer now requires an active event instead of activating one.
     */
    status?: CreateEventDto.status;
    /**
     * The pack this event grants access to. Membership in the event is what entitles a player to the pack.
     */
    packId?: Record<string, any> | null;
};
export namespace CreateEventDto {
    /**
     * The visibility of the event
     */
    export enum visibility {
        PUBLIC = 'public',
        PRIVATE = 'private',
    }
    /**
     * The type of event
     */
    export enum type {
        EVENT = 'event',
        SERVER = 'server',
    }
    /**
     * Lifecycle status. Owned by the events module — the randomizer now requires an active event instead of activating one.
     */
    export enum status {
        UPCOMING = 'upcoming',
        ACTIVE = 'active',
        COMPLETED = 'completed',
    }
}

